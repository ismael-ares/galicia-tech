// Community identity takes precedence over its hosting platform (e.g. Meetup).
// These are the same official assets used by the agenda, kept locally.
export function communityLogo(identity: string): string | null {
 if (/wordpress/i.test(identity)) return 'wordpress.png';
 if (/python/i.test(identity)) return 'python.png';
 if (/corunajug|coruña\s*jug|\bjug\b/i.test(identity)) return 'corunajug.png';
 if (/\bgpul\b/i.test(identity)) return 'gpul.svg';
 if (/\bgdg\b|gdg\.community\.dev/i.test(identity)) return 'gdg.png';
 if (/meetup/i.test(identity)) return 'meetup.png';
 return null;
}
