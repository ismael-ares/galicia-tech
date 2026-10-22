#!/usr/bin/env python3
"""Descubrimiento manual y acotado de imágenes oficiales para el mock Galicia Tech."""
from __future__ import annotations

import argparse
import hashlib
import html
import io
import json
import os
import re
import struct
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

try:  # Pillow es opcional; la prueba funciona también con la biblioteca estándar.
    from PIL import Image as PillowImage
except ImportError:  # pragma: no cover - depende del runtime disponible
    PillowImage = None

ROOT = Path(__file__).resolve().parent
DEFAULT_INPUT = ROOT / "mock" / "cover-sources.json"
DEFAULT_MANIFEST = ROOT / "mock" / "cover-manifest.json"
DEFAULT_JS = ROOT / "mock" / "cover-manifest.js"
DEFAULT_REVIEW = ROOT / "mock" / "cover-review.json"
DEFAULT_REPORTS = ROOT / "output" / "cover_discovery"
MAX_HTML_BYTES = 3_000_000
MAX_IMAGE_BYTES = 256_000
TIMEOUT = 15
MAX_IMAGES_PER_PAGE = 80
MAX_CANDIDATES_PER_EVENT = 160
GENERIC_MARKERS = re.compile(r"(?:favicon|sprite|avatar|profile|speaker|sponsor|partner|logo|social.?sharing|default.?image|placeholder|badge|icon|qr.?code|tracking|pixel|sessionize\.com/image/[^\s]*400o400o1)", re.I)
GENERIC_FILE_MARKERS = re.compile(r"(?:open[-_ ]?graph|social.?sharing|default.?event|default.?share|share[-_ ]?image|og[-_ ]?image|favicon|thumbnail)", re.I)


def normalized(value: str) -> str:
    value = html.unescape(value or "").lower()
    return re.sub(r"[^a-z0-9]+", " ", value).strip()


def tokens_for(event: dict[str, Any]) -> set[str]:
    stop = {"the", "and", "para", "en", "del", "de", "la", "el", "da", "do", "of", "at", "with", "evento", "event"}
    return {token for token in normalized(event.get("title", "")).split() if len(token) >= 3 and token not in stop}


class PageParser(HTMLParser):
    def __init__(self, base_url: str):
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.title_parts: list[str] = []
        self.in_title = False
        self.meta: list[dict[str, str]] = []
        self.images: list[dict[str, str]] = []
        self.jsonld: list[str] = []
        self.nextdata: list[str] = []
        self._script_kind: str | None = None
        self._script_parts: list[str] = []
        self._context: list[tuple[str, str]] = []
        self._in_caption = 0
        self._caption_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs = [(key.lower(), value or "") for key, value in attrs]
        attr = dict(attrs)
        if tag == "title":
            self.in_title = True
        if tag == "figcaption":
            self._in_caption += 1
        if tag == "script":
            self._script_parts = []
            kind = attr.get("type", "").lower()
            script_id = attr.get("id", "").lower()
            if kind == "application/ld+json":
                self._script_kind = "jsonld"
            elif script_id == "__next_data__":
                self._script_kind = "nextdata"
            else:
                self._script_kind = None
        if tag in {"article", "figure", "picture", "section", "div", "a"}:
            ctx = " ".join(attr.get(key, "") for key in ("id", "class", "aria-label", "title", "data-testid"))
            self._context.append((tag, ctx[:240]))
        if tag == "meta":
            self.meta.append(attr)
        if tag == "img":
            src = attr.get("src") or attr.get("data-src") or attr.get("data-lazy-src") or attr.get("data-original")
            options = [(src, "html-image")] if src else []
            options.extend((item.split()[0], "srcset-image") for item in re.split(r",\s*(?![^()]*\))", attr.get("srcset", "")) if item.strip())
            for image_url, kind in options:
                if len(self.images) >= MAX_IMAGES_PER_PAGE:
                    break
                ctx = " ".join((attr.get("alt", ""), attr.get("title", ""), attr.get("class", ""), *(value for _, value in self._context[-3:] if value)))
                self.images.append({"url": image_url, "alt": attr.get("alt", ""), "title": attr.get("title", ""), "caption": " ".join(self._caption_parts), "context": ctx[:600], "kind": kind})
        if tag == "source":
            srcset = attr.get("srcset", "").strip()
            if srcset and len(self.images) < MAX_IMAGES_PER_PAGE:
                first = srcset.split(",", 1)[0].strip().split()[0]
                ctx = " ".join((attr.get("media", ""), attr.get("type", ""), *(value for _, value in self._context[-3:] if value)))
                self.images.append({"url": first, "alt": "", "context": ctx[:600], "kind": "html-source"})
        style = attr.get("style", "")
        if style and len(self.images) < MAX_IMAGES_PER_PAGE:
            for image_url in re.findall(r"url\(\s*['\"]?([^'\")]+)", style, re.I):
                ctx = " ".join((attr.get("id", ""), attr.get("class", ""), attr.get("aria-label", ""), attr.get("title", ""), *(value for _, value in self._context[-3:] if value)))
                self.images.append({"url": image_url.strip(), "alt": attr.get("alt", ""), "title": attr.get("title", ""), "caption": " ".join(self._caption_parts), "context": ctx[:600], "kind": "css-background"})
        href = attr.get("href", "") if tag == "a" else ""
        if href and re.search(r"\.(?:png|jpe?g|webp|svg)(?:\?|$)", href, re.I) and len(self.images) < MAX_IMAGES_PER_PAGE:
            ctx = " ".join((attr.get("aria-label", ""), attr.get("title", ""), *(value for _, value in self._context[-3:] if value)))
            self.images.append({"url": href, "alt": "", "title": attr.get("title", ""), "caption": " ".join(self._caption_parts), "context": ctx[:600], "kind": "image-link"})

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False
        if tag == "figcaption" and self._in_caption:
            self._in_caption -= 1
        if tag == "script" and self._script_kind:
            body = "".join(self._script_parts).strip()
            if body:
                (self.jsonld if self._script_kind == "jsonld" else self.nextdata).append(body[:MAX_HTML_BYTES])
            self._script_kind = None
            self._script_parts = []
        if tag in {"article", "figure", "picture", "section", "div", "a"}:
            for index in range(len(self._context) - 1, -1, -1):
                if self._context[index][0] == tag:
                    del self._context[index:]
                    break

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)
        if self._in_caption:
            self._caption_parts.append(data.strip())
        if self._script_kind:
            self._script_parts.append(data)


def resolve_url(base: str, candidate: str) -> str | None:
    candidate = html.unescape(candidate.strip()).replace("\\u0026", "&").replace("\\/", "/")
    if not candidate or candidate.startswith(("data:", "blob:", "javascript:", "#")):
        return None
    url = urllib.parse.urljoin(base, candidate)
    parts = urllib.parse.urlsplit(url)
    if parts.scheme not in {"http", "https"} or not parts.netloc:
        return None
    # Conservar query strings firmadas y transformaciones CDN; quitar solo fragment.
    return urllib.parse.urlunsplit((parts.scheme, parts.netloc, parts.path, parts.query, ""))


def _walk_json_event_images(node: Any, event: dict[str, Any], page_url: str) -> list[dict[str, Any]]:
    found: list[dict[str, Any]] = []
    if isinstance(node, dict):
        types = node.get("@type", [])
        if isinstance(types, str):
            types = [types]
        name = str(node.get("name", ""))
        if any(str(t).lower().endswith("event") for t in types) and _title_matches(name, event):
            for value in _image_values(node.get("image")):
                found.append({"url": value, "alt": "", "event_object_name": name, "context": f"JSON-LD Event.image; objeto Event.name={name}", "kind": "jsonld-event-image"})
        for value in node.values():
            found.extend(_walk_json_event_images(value, event, page_url))
    elif isinstance(node, list):
        for value in node:
            found.extend(_walk_json_event_images(value, event, page_url))
    return found


def _image_values(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        return [url for item in value for url in _image_values(item)]
    if isinstance(value, dict):
        for key in ("contentUrl", "url", "@id"):
            if isinstance(value.get(key), str):
                return [value[key]]
    return []


def _walk_embedded_images(node: Any, event: dict[str, Any], context: str = "") -> list[dict[str, Any]]:
    found: list[dict[str, Any]] = []
    if isinstance(node, dict):
        # Solo identidad propia del nodo. Descripciones largas, IDs opacos y
        # títulos heredados del padre no describen la imagen que contiene.
        local = " ".join(str(node.get(k, "")) for k in ("name", "title", "slug"))
        # El objeto que contiene image debe identificar por sí mismo el evento.
        # No heredar el título de la página raíz para elevar una imagen de ponente.
        matched = _title_matches(local, event)
        for key in ("image", "imageUrl", "image_url", "banner", "bannerImage", "picture", "cover", "thumbnail"):
            if key in node and matched:
                for value in _image_values(node[key]):
                    found.append({"url": value, "alt": "", "event_object_name": local, "context": f"campo {key} en objeto embebido identificado como evento", "kind": "embedded-event-image"})
        for value in node.values():
            found.extend(_walk_embedded_images(value, event, context))
    elif isinstance(node, list):
        for value in node:
            found.extend(_walk_embedded_images(value, event, context))
    return found


def _title_matches(text: str, event: dict[str, Any]) -> bool:
    hay = normalized(text)
    tokens = tokens_for(event)
    if not tokens:
        return False
    # Evita depender del título largo exacto: se requieren dos tokens distintivos.
    return len(tokens & set(hay.split())) >= min(2, len(tokens))


def parse_page(html_text: str, page_url: str, event: dict[str, Any], source_kind: str) -> dict[str, Any]:
    parser = PageParser(page_url)
    parser.feed(html_text)
    parser.close()
    title = " ".join(parser.title_parts).strip()
    page_tokens_match = _title_matches(title, event)
    candidates: list[dict[str, Any]] = []
    for attrs in parser.meta:
        prop = (attrs.get("property") or attrs.get("name") or attrs.get("itemprop") or "").lower()
        if prop in {"og:image", "og:image:url", "twitter:image", "twitter:image:src", "image"}:
            url = attrs.get("content")
            if url:
                candidates.append({"url": url, "alt": attrs.get("alt", ""), "context": f"meta {prop} · {title}", "kind": prop})
    candidates.extend(parser.images)
    for text in parser.jsonld:
        try:
            candidates.extend(_walk_json_event_images(json.loads(text), event, page_url))
        except (json.JSONDecodeError, TypeError):
            continue
    for text in parser.nextdata:
        try:
            candidates.extend(_walk_embedded_images(json.loads(text), event))
        except (json.JSONDecodeError, TypeError):
            # El contenido embebido no siempre es JSON válido; no se ejecuta ni evalúa.
            continue
    accepted: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []
    seen: set[str] = set()
    for candidate in sorted(candidates, key=specificity_priority)[:MAX_CANDIDATES_PER_EVENT]:
        url = resolve_url(page_url, candidate.get("url", ""))
        if not url or url in seen:
            continue
        candidate = {**candidate, "url": url, "page": page_url, "page_title": title, "source_kind": source_kind}
        specificity, reason = classify_candidate(candidate, event)
        candidate["specificity"] = specificity
        if specificity != "specific":
            rejected.append({"url": url, "kind": candidate["kind"], "status": specificity, "reason": reason or "No hay evidencia específica.", "page": page_url})
            continue
        seen.add(url)
        evidence = evidence_for(candidate, event, page_tokens_match)
        candidate["evidence"] = evidence
        candidate["priority"] = specificity_priority(candidate)
        accepted.append(candidate)
    # Una referencia débil (OG) no debe ocultar evidencia posterior más fuerte.
    rejected = list({item["url"]: item for item in rejected if item["url"] not in seen}.values())
    accepted.sort(key=lambda item: (item["priority"], item["url"]))
    return {"title": title, "page_title_matches": page_tokens_match, "candidates": accepted, "rejected": rejected}


def classify_candidate(candidate: dict[str, Any], event: dict[str, Any]) -> tuple[str, str | None]:
    """Clasifica por evidencia propia de la imagen, nunca por el título de página."""
    url = candidate.get("url", "")
    path = urllib.parse.unquote(urllib.parse.urlsplit(url).path)
    kind = candidate.get("kind", "")
    own_text = " ".join((candidate.get("alt", ""), candidate.get("title", ""), candidate.get("caption", "")))
    local_context = " ".join((own_text, candidate.get("context", "")))
    expected = str(event.get("year", ""))
    years = re.findall(r"\b20\d{2}\b", " ".join((own_text, candidate.get("context", ""), path.replace("-", " ").replace("_", " "))))
    if expected and any(year != expected for year in years):
        return "uncertain", f"La referencia explícita de año no coincide con {expected}."

    # Los metadatos del objeto Event/registro embebido son evidencia de pertenencia,
    # siempre que el propio recurso no sea un branding genérico reconocido.
    object_evidence = kind in {"jsonld-event-image", "embedded-event-image"}
    image_text_match = bool(own_text.strip() and _title_matches(own_text, event))
    path_tokens_match = _title_matches(path.replace("/", " "), event)
    year_in_path = bool(expected and re.search(rf"(?:^|[^0-9]){re.escape(expected)}(?:[^0-9]|$)", path.replace("-", " ").replace("_", " ")))
    generic_url = bool(GENERIC_MARKERS.search(url))
    generic_filename = bool(GENERIC_FILE_MARKERS.search(Path(path).name))
    event_name_match = _title_matches(candidate.get("event_object_name", ""), event)
    if generic_url:
        return "brand-only", "La ruta identifica logo, avatar, socio o recurso de marca/interfaz."
    if generic_filename:
        return "brand-only", "El objeto Event se refiere al evento, pero el recurso usa un nombre genérico de imagen social/default; falta evidencia específica de la imagen."
    if object_evidence and event_name_match and not generic_url and not generic_filename:
        return "specific", None
    if image_text_match and not generic_url:
        return "specific", None
    if path_tokens_match and year_in_path and not generic_url:
        return "specific", None
    if kind in {"og:image", "og:image:url", "twitter:image", "twitter:image:src", "image"}:
        return "uncertain", "Metadato social sin texto, ruta u objeto de imagen que identifique específicamente este evento."
    if "poster" in local_context.lower() or "event-banner" in local_context.lower():
        return "uncertain", "La estructura parece de cartel/banner, pero no identifica esta edición concreta."
    return "uncertain", "La imagen no contiene contexto propio suficiente para identificar evento y edición."


def specificity_priority(candidate: dict[str, Any]) -> int:
    # Orden por tipo de vínculo verificable, no por puntuaciones presentadas como confianza.
    return {"jsonld-event-image": 0, "embedded-event-image": 1}.get(candidate.get("kind"), 2)


def evidence_for(candidate: dict[str, Any], event: dict[str, Any], page_title_matches: bool) -> str:
    kind = candidate.get("kind", "")
    if kind == "jsonld-event-image":
        return "JSON-LD Event.image dentro de objeto Event con nombre coincidente y URL no genérica"
    if kind == "embedded-event-image":
        return "Estado embebido con título del evento coincidente"
    if kind in {"og:image", "og:image:url", "twitter:image", "twitter:image:src", "image"}:
        if candidate.get("source_kind") == "event-page" and page_title_matches:
            return f"{kind} de la ficha directa del evento"
        return f"{kind} en página oficial cuyo contenido identifica el evento"
    return "Imagen del cuerpo con alt/contexto que identifica el evento"


def fetch_text(url: str) -> tuple[str, str]:
    request = urllib.request.Request(url, headers={"User-Agent": "EventosGaliciaCoverCheck/1.0", "Accept": "text/html,application/xhtml+xml"})
    with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
        raw = response.read(MAX_HTML_BYTES + 1)
        if len(raw) > MAX_HTML_BYTES:
            raise ValueError(f"HTML supera el límite de {MAX_HTML_BYTES} bytes")
        charset = response.headers.get_content_charset() or "utf-8"
        return raw.decode(charset, "replace"), response.geturl()


def image_dimensions(data: bytes, content_type: str) -> tuple[int, int] | None:
    if PillowImage is not None:
        try:
            with PillowImage.open(io.BytesIO(data)) as image:
                width, height = image.size
                if width > 0 and height > 0:
                    return width, height
        except Exception:
            # Un prefijo parcial puede no bastar a Pillow; se prueban lectores mínimos.
            pass
    if data.startswith(b"\x89PNG\r\n\x1a\n") and len(data) >= 24:
        return struct.unpack(">II", data[16:24])
    if data[:6] in (b"GIF87a", b"GIF89a") and len(data) >= 10:
        return struct.unpack("<HH", data[6:10])
    if data[:2] == b"\xff\xd8":
        pos = 2
        while pos + 9 < len(data):
            if data[pos] != 0xFF:
                pos += 1
                continue
            marker = data[pos + 1]
            pos += 2
            if marker in {0xD8, 0xD9, 0x01} or 0xD0 <= marker <= 0xD7:
                continue
            if pos + 2 > len(data):
                break
            size = int.from_bytes(data[pos:pos + 2], "big")
            if size < 2 or pos + size > len(data):
                break
            if marker in {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF} and size >= 7:
                height = int.from_bytes(data[pos + 3:pos + 5], "big")
                width = int.from_bytes(data[pos + 5:pos + 7], "big")
                return width, height
            pos += size
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        kind = data[12:16]
        if kind == b"VP8X" and len(data) >= 30:
            width = 1 + int.from_bytes(data[24:27], "little")
            height = 1 + int.from_bytes(data[27:30], "little")
            return width, height
        if kind == b"VP8 " and len(data) >= 30:
            width = int.from_bytes(data[26:28], "little") & 0x3FFF
            height = int.from_bytes(data[28:30], "little") & 0x3FFF
            return width, height
        if kind == b"VP8L" and len(data) >= 25:
            b1, b2, b3, b4 = data[21:25]
            return 1 + (((b2 & 0x3F) << 8) | b1), 1 + (((b4 & 0x0F) << 10) | (b3 << 2) | ((b2 & 0xC0) >> 6))
    if content_type.lower().split(";", 1)[0].strip() == "image/svg+xml" or data.lstrip().startswith(b"<svg"):
        try:
            root = ET.fromstring(data[:MAX_IMAGE_BYTES])
            viewbox = root.attrib.get("viewBox") or root.attrib.get("viewbox")
            if viewbox:
                numbers = re.split(r"[\s,]+", viewbox.strip())
                if len(numbers) == 4:
                    return max(0, int(float(numbers[2]))), max(0, int(float(numbers[3])))
            w = re.match(r"([0-9.]+)", root.attrib.get("width", ""))
            h = re.match(r"([0-9.]+)", root.attrib.get("height", ""))
            if w and h:
                return int(float(w.group(1))), int(float(h.group(1)))
        except (ET.ParseError, ValueError):
            return None
    return None


def inspect_image(url: str, min_width: int = 300, min_height: int = 160) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"User-Agent": "EventosGaliciaCoverCheck/1.0", "Accept": "image/*", "Range": f"bytes=0-{MAX_IMAGE_BYTES - 1}"})
    with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
        content_type = response.headers.get("Content-Type", "").lower()
        if not content_type.startswith("image/"):
            return {"ok": False, "reason": f"Content-Type no es imagen ({content_type or 'ausente'})."}
        raw = response.read(MAX_IMAGE_BYTES)
        content_range = response.headers.get("Content-Range", "")
        match = re.search(r"/([0-9]+|\*)$", content_range)
        total = int(match.group(1)) if match and match.group(1).isdigit() else None
        declared = response.headers.get("Content-Length")
        complete = total == len(raw) if total is not None else bool(declared and declared.isdigit() and int(declared) <= len(raw))
        dims = image_dimensions(raw, content_type)
        if not dims:
            return {"ok": False, "reason": "No se pudieron verificar dimensiones con el prefijo descargado."}
        width, height = dims
        if width < min_width or height < min_height:
            return {"ok": False, "reason": f"Resolución insuficiente ({width}×{height}; mínimo {min_width}×{min_height}).", "width": width, "height": height}
        return {"ok": True, "content_type": content_type.split(";", 1)[0], "width": width, "height": height, "final_url": response.geturl(), "sha256": hashlib.sha256(raw).hexdigest(), "sha256_scope": "full" if complete else f"prefix-{len(raw)}-bytes"}


def _review_rejection(url: str, review_event: dict[str, Any]) -> dict[str, Any] | None:
    exact = next((item for item in review_event.get("rejected", []) if item.get("url") == url), None)
    if exact:
        return exact
    # Meetup publica el mismo recurso con varios tamaños, dominios y query strings.
    # Una revisión del recurso debe impedir que reaparezca mediante otro recorte.
    parts = urllib.parse.urlsplit(url)
    host = (parts.hostname or "").lower()
    if host == "meetupstatic.com" or host.endswith(".meetupstatic.com"):
        path = urllib.parse.unquote(parts.path)
        match = re.search(r"/images/classic-events/(\d+)(?:/|$)|/photos/event/.*/(?:event_|600_)?(\d+)\.", path)
        if match:
            asset_id = next(value for value in match.groups() if value)
            return next((item for item in review_event.get("rejectedAssets", []) if item.get("provider") == "meetup" and str(item.get("id")) == asset_id), None)
    return None


def _previous_is_specific(previous: dict[str, Any] | None, review_event: dict[str, Any]) -> bool:
    selected = (previous or {}).get("selected") or {}
    url = selected.get("url", "")
    if not url or _review_rejection(url, review_event):
        return False
    if selected.get("specificity") == "specific":
        return True
    if selected.get("evidenceType") in {"jsonld-event-image", "embedded-event-image"}:
        path = urllib.parse.unquote(urllib.parse.urlsplit(url).path)
        return not GENERIC_MARKERS.search(url) and not GENERIC_FILE_MARKERS.search(Path(path).name)
    # Metadatos sociales históricos sin pruebas propias no se elevan a portada validada.
    return False


def discover_event(event: dict[str, Any], previous: dict[str, Any] | None, text_fetch=fetch_text, image_check=inspect_image, review_event: dict[str, Any] | None = None) -> dict[str, Any]:
    pages = [{"url": event["event_page"], "kind": "event-page"}]
    pages.extend({"url": url, "kind": "official-page"} for url in event.get("official_pages", [])[:2])
    candidates: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []
    read_pages: list[dict[str, Any]] = []
    seen: set[str] = set()
    review_event = review_event or {}
    for page in pages[:3]:
        try:
            body, final_url = text_fetch(page["url"])
            parsed = parse_page(body, final_url, event, page["kind"])
            for item in parsed["candidates"]:
                reviewed = _review_rejection(item["url"], review_event)
                if reviewed:
                    rejected.append({"url": item["url"], "kind": item["kind"], "status": "brand-only", "reason": f"Revisión manual: {reviewed.get('reason', 'candidato descartado')}" + (f" SHA-256 {reviewed['sha256']}" if reviewed.get("sha256") else ""), "page": page["url"]})
                    continue
                if item["url"] not in seen:
                    seen.add(item["url"])
                    candidates.append(item)
            rejected.extend(parsed["rejected"])
            for item in rejected:
                reviewed = _review_rejection(item["url"], review_event)
                if reviewed and reviewed.get("reason") not in item.get("reason", ""):
                    item["reason"] = f"Revisión manual: {reviewed.get('reason', 'candidato descartado')}" + (f" SHA-256 {reviewed['sha256']}" if reviewed.get("sha256") else "")
                    item["status"] = "brand-only"
            read_pages.append({"requested_url": page["url"], "url": final_url, "kind": page["kind"], "status": "ok", "title": parsed["title"], "candidates": len(parsed["candidates"])})
        except Exception as exc:  # la página falla sin borrar portadas anteriores
            errors.append({"url": page["url"], "reason": f"{type(exc).__name__}: {str(exc)[:240]}"})
            read_pages.append({"requested_url": page["url"], "kind": page["kind"], "status": "error", "error": errors[-1]["reason"]})
    # Si el mismo metadato de compartir se repite en páginas hermanas, eso describe
    # branding del sitio; no agrega especificidad del evento.
    meta_kinds = {"og:image", "og:image:url", "twitter:image", "twitter:image:src", "image"}
    rejected_urls: dict[str, list[dict[str, Any]]] = {}
    for item in rejected:
        if item.get("kind") in meta_kinds:
            rejected_urls.setdefault(item["url"], []).append(item)
    for url, items in rejected_urls.items():
        if len({item.get("page") for item in items}) > 1:
            for item in items:
                item["status"] = "brand-only"
                repeated_reason = "El mismo metadato de compartir se repite en páginas oficiales del sitio y no identifica una pieza específica del evento."
                if repeated_reason not in item["reason"]:
                    item["reason"] += " " + repeated_reason
                item["status"] = "brand-only"
    candidates.sort(key=lambda item: item["priority"])
    checks: list[dict[str, Any]] = []
    selected: dict[str, Any] | None = None
    # Verifica pocos candidatos en orden probatorio, evitando descargar galerías completas.
    for candidate in candidates[:8]:
        try:
            result = image_check(candidate["url"])
        except Exception as exc:
            result = {"ok": False, "reason": f"{type(exc).__name__}: {str(exc)[:200]}"}
        record = {"url": candidate["url"], "kind": candidate["kind"], "specificity": candidate["specificity"], "evidence": candidate["evidence"], "page": candidate["page"], **result}
        checks.append(record)
        if result.get("ok"):
            selected = {"url": candidate["url"], "imageSource": candidate["evidence"], "imagePage": candidate["page"], "evidenceType": candidate["kind"], "specificity": candidate["specificity"], "contentType": result["content_type"], "width": result["width"], "height": result["height"], "sha256": result.get("sha256"), "sha256Scope": result.get("sha256_scope"), "status": "selected", "checkedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
            break
        rejected.append({"url": candidate["url"], "kind": candidate["kind"], "reason": result.get("reason", "No verificable."), "page": candidate["page"]})
    if selected:
        return {"id": event["id"], "title": event["title"], "selected": selected, "status": "selected", "pages": read_pages, "candidates_checked": checks, "rejected": rejected[:80], "errors": errors}
    if _previous_is_specific(previous, review_event):
        retained = dict(previous["selected"])
        retained["status"] = "retained"
        return {"id": event["id"], "title": event["title"], "selected": retained, "status": "retained", "pages": read_pages, "candidates_checked": checks, "rejected": rejected[:80], "errors": errors, "retention_note": "No se encontró/verificó una portada nueva; se conserva la anterior, antes validada como específica."}
    status = "error" if errors and read_pages and all(page["status"] == "error" for page in read_pages) else "no-image"
    return {"id": event["id"], "title": event["title"], "selected": None, "status": status, "pages": read_pages, "candidates_checked": checks, "rejected": rejected[:80], "errors": errors, "retention_note": "Se mostrará la portada automática local."}


def manifest_js(data: dict[str, Any]) -> str:
    entries = {}
    for event in data.get("events", []):
        selected = event.get("selected")
        entries[event["id"]] = selected or {"url": None, "imageSource": None, "imagePage": None, "evidenceType": None, "status": event.get("status", "no-image")}
    text = json.dumps({"evaluatedAt": data.get("evaluatedAt"), "events": entries}, ensure_ascii=False, separators=(",", ":"))
    text = text.replace("</", "<\\/")
    return "window.GALICIA_COVER_MANIFEST = " + text + ";\n"


def backup(path: Path) -> Path | None:
    if not path.exists():
        return None
    stamp = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
    backup_path = path.with_name(f"{path.stem}.before-{stamp}{path.suffix}")
    suffix = 1
    while backup_path.exists():
        backup_path = path.with_name(f"{path.stem}.before-{stamp}-{suffix}{path.suffix}")
        suffix += 1
    backup_path.write_bytes(path.read_bytes())
    return backup_path


def write_atomic(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(text, encoding="utf-8")
    os.replace(temp, path)


def render_report(data: dict[str, Any]) -> str:
    lines = ["# Informe manual de descubrimiento de portadas", "", f"- Fecha de revisión: {data['evaluatedAt']}", "- Método: fichas públicas de eventos y hasta dos páginas oficiales enlazadas; sin buscador ni llamadas LLM.", "- Solo se eligen imágenes con vínculo propio a la edición; título/OG de página por sí solos quedan como marca o pendiente.", "- Un fallo de consulta conserva una portada anterior validada como específica; una imagen revisada como genérica no se resucita.", ""]
    for event in data.get("events", []):
        selected = event.get("selected") or {}
        lines += [f"## {event['title']}", f"- Estado: **{event['status']}**", f"- Imagen: {selected.get('url') or 'sin imagen; se usa portada automática local'}"]
        if selected:
            lines.append(f"- Evidencia: {selected.get('imageSource')} · {selected.get('evidenceType')} · {selected.get('width')}×{selected.get('height')} · SHA-256 ({selected.get('sha256Scope','desconocido')}): `{selected.get('sha256','no registrado')}`")
            lines.append(f"- Página de imagen: {selected.get('imagePage')}")
        for error in event.get("errors", []):
            lines.append(f"- Fallo de fuente: {error['url']} — {error['reason']}")
        for rejected in event.get("rejected", [])[:5]:
            lines.append(f"- Candidato {rejected.get('status','descartado')}: {rejected['url']} — {rejected['reason']}")
        lines.append("")
    return "\n".join(lines)


def run(args: argparse.Namespace) -> dict[str, Any]:
    source_data = json.loads(args.input.read_text(encoding="utf-8"))
    review = json.loads(args.review.read_text(encoding="utf-8")) if args.review.exists() else {"events": {}}
    previous = json.loads(args.manifest.read_text(encoding="utf-8")) if args.manifest.exists() else {"events": []}
    previous_by_id = {event["id"]: event for event in previous.get("events", [])}
    backup_path = backup(args.manifest)
    results = [discover_event(event, previous_by_id.get(event["id"]), review_event=review.get("events", {}).get(event["id"], {})) for event in source_data["events"]]
    out = {"version": 1, "evaluatedAt": args.as_of, "timezone": "Europe/Madrid", "sourceInput": str(args.input.relative_to(ROOT)), "events": results}
    write_atomic(args.manifest, json.dumps(out, ensure_ascii=False, indent=2) + "\n")
    write_atomic(args.javascript, manifest_js(out))
    args.reports.mkdir(parents=True, exist_ok=True)
    report = args.reports / f"cover-discovery-{time.strftime('%Y%m%dT%H%M%SZ', time.gmtime())}.md"
    write_atomic(report, render_report(out))
    summary = {"selected": sum(e["status"] == "selected" for e in results), "retained": sum(e["status"] == "retained" for e in results), "fallback": sum(e["selected"] is None for e in results), "errors": sum(len(e["errors"]) for e in results), "manifest": str(args.manifest), "javascript": str(args.javascript), "report": str(report), "backup": str(backup_path) if backup_path else None}
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--javascript", type=Path, default=DEFAULT_JS)
    parser.add_argument("--review", type=Path, default=DEFAULT_REVIEW)
    parser.add_argument("--reports", type=Path, default=DEFAULT_REPORTS)
    parser.add_argument("--as-of", default="2026-10-19", help="Fecha de referencia de la muestra (YYYY-MM-DD)")
    args = parser.parse_args()
    try:
        time.strptime(args.as_of, "%Y-%m-%d")
        run(args)
        return 0
    except Exception as exc:
        print(f"cover discovery failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
