"""
Internationalization (i18n) service - Multi-language support
"""
from typing import Dict, Optional
from pathlib import Path
import json
from fastapi import Request

from app.core.config import settings


class I18nService:
    """Internationalization service for multi-language support"""
    
    def __init__(self):
        """Initialize i18n service"""
        self.translations = {}
        self.default_language = settings.DEFAULT_LANGUAGE or 'en'
        self.supported_languages = settings.SUPPORTED_LANGUAGES or ['en', 'af', 'zu']
        self.load_translations()
    
    def load_translations(self):
        """Load translation files"""
        translations_dir = Path(__file__).parent.parent / 'translations'
        
        for lang in self.supported_languages:
            translation_file = translations_dir / f'{lang}.json'
            if translation_file.exists():
                with open(translation_file, 'r', encoding='utf-8') as f:
                    self.translations[lang] = json.load(f)
            else:
                self.translations[lang] = {}
    
    def get_language_from_request(self, request: Request) -> str:
        """
        Get language from request
        
        Priority:
        1. Query parameter ?lang=af
        2. Accept-Language header
        3. Default language
        """
        # Check query parameter
        lang = request.query_params.get('lang')
        if lang and lang in self.supported_languages:
            return lang
        
        # Check Accept-Language header
        accept_language = request.headers.get('accept-language', '')
        for lang in self.supported_languages:
            if lang in accept_language.lower():
                return lang
        
        # Return default
        return self.default_language
    
    def translate(
        self,
        key: str,
        language: str = 'en',
        params: Optional[Dict] = None
    ) -> str:
        """
        Translate a key to target language
        
        Args:
            key: Translation key (e.g., 'email.application_confirmation.subject')
            language: Target language code
            params: Parameters for string formatting
            
        Returns:
            Translated string
        """
        # Get translation dict for language
        lang_dict = self.translations.get(language, self.translations.get(self.default_language, {}))
        
        # Navigate nested keys (e.g., 'email.subject')
        keys = key.split('.')
        value = lang_dict
        
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                break
        
        # If translation not found, return key
        if not isinstance(value, str):
            return key
        
        # Format with params if provided
        if params:
            try:
                value = value.format(**params)
            except (KeyError, ValueError):
                pass
        
        return value
    
    def t(self, key: str, lang: str = 'en', **kwargs) -> str:
        """Shorthand for translate"""
        return self.translate(key, lang, kwargs)


# Create service instance
i18n_service = I18nService()


# ============= Translation Helper Functions =============

def get_translations_dict(language: str) -> Dict:
    """Get all translations for a language"""
    return i18n_service.translations.get(language, {})


def translate_application_status(status: str, language: str = 'en') -> str:
    """Translate application status"""
    return i18n_service.translate(f'application.status.{status}', language)


def translate_job_status(status: str, language: str = 'en') -> str:
    """Translate job status"""
    return i18n_service.translate(f'job.status.{status}', language)


def translate_candidate_status(status: str, language: str = 'en') -> str:
    """Translate candidate status"""
    return i18n_service.translate(f'candidate.status.{status}', language)
