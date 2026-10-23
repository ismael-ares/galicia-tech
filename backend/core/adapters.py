from cryptography.fernet import Fernet
from django.conf import settings
from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.mfa.adapter import DefaultMFAAdapter

class AccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request):
        return settings.ALLOW_REGISTRATION

class SocialAdapter(DefaultSocialAccountAdapter):
    def is_open_for_signup(self, request, sociallogin):
        return False

class MFAAdapter(DefaultMFAAdapter):
    def encrypt(self, text):
        return Fernet(settings.MFA_ENCRYPTION_KEY.encode()).encrypt(text.encode()).decode()
    def decrypt(self, encrypted_text):
        return Fernet(settings.MFA_ENCRYPTION_KEY.encode()).decrypt(encrypted_text.encode()).decode()
