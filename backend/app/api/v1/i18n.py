"""
Internationalization API endpoints - Multi-language support
"""
from fastapi import APIRouter, Query, Request
from typing import Dict

from app.services.i18n_service import i18n_service, get_translations_dict

router = APIRouter()


@router.get("/translations/{language}")
async def get_translations(
    language: str,
    request: Request
):
    """
    Get all translations for a specific language
    
    **Supported languages**: en (English), af (Afrikaans), zu (Zulu)
    
    **Returns**: Complete translation dictionary
    """
    if language not in i18n_service.supported_languages:
        return {
            "error": f"Language '{language}' not supported",
            "supported_languages": i18n_service.supported_languages
        }
    
    translations = get_translations_dict(language)
    
    return {
        "language": language,
        "translations": translations
    }


@router.get("/languages")
async def get_supported_languages():
    """
    Get list of supported languages
    
    **Returns**: List of language codes and names
    """
    return {
        "default_language": i18n_service.default_language,
        "supported_languages": [
            {"code": "en", "name": "English", "native_name": "English"},
            {"code": "af", "name": "Afrikaans", "native_name": "Afrikaans"},
            {"code": "zu", "name": "Zulu", "native_name": "isiZulu"}
        ]
    }


@router.get("/translate")
async def translate_key(
    key: str = Query(..., description="Translation key (e.g., 'email.subject')"),
    lang: str = Query("en", description="Language code"),
    request: Request = None
):
    """
    Translate a specific key
    
    **Example**: /translate?key=email.application_confirmation.subject&lang=af
    """
    # Auto-detect language from request if not specified
    if not lang and request:
        lang = i18n_service.get_language_from_request(request)
    
    translation = i18n_service.translate(key, lang)
    
    return {
        "key": key,
        "language": lang,
        "translation": translation
    }
