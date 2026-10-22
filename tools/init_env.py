#!/usr/bin/env python3
"""Create deployment secrets locally without printing or committing them."""
import base64
import os
from pathlib import Path
import secrets
root = Path(__file__).resolve().parent.parent
path = root / '.env'
values = (root / '.env.example').read_text()
for name, value in [('DJANGO_SECRET_KEY', secrets.token_urlsafe(64)),
                    ('POSTGRES_PASSWORD', secrets.token_urlsafe(32)),
                    ('MFA_ENCRYPTION_KEY', base64.urlsafe_b64encode(os.urandom(32)).decode())]:
    values = values.replace(name + '=\n', name + '=' + value + '\n')
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, 'w') as output:
    output.write(values)
print('Created .env with private local secrets. Existing files are never overwritten.')
