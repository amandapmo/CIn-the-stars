def build_agent_input(
    visual_suspicions: dict[str, float] | None = None,
    model_source: str | None = None,
) -> dict:
    """Format symptom scores supplied by a future validated visual model."""
    visual_suspicions = visual_suspicions or {}
    return {
        'status': (
            'suspicions_provided' if visual_suspicions else 'not_analyzed'
        ),
        'model_source': model_source,
        'visual_suspicions': [
            {'symptom': symptom, 'model_confidence': confidence}
            for symptom, confidence in visual_suspicions.items()
        ],
        'is_definitive_diagnosis': False,
        'confidence_note': (
            'Model scores do not establish the cause or guarantee calibration.'
        ),
        'follow_up_questions': [
            'Qual cultura está sendo plantada?',
            'Quando os sintomas começaram?',
            'O problema aparece em outras folhas?',
            'Há alterações no verso da folha?',
            'Houve mudanças recentes nas condições ambientais?',
        ],
        'capture_guidance': (
            'Fotografe uma folha principal de perto, bem enquadrada e '
            'iluminada, preferencialmente sobre fundo neutro. '
            'Não é necessário arrancar a folha ou identificar a espécie '
            'antes da análise visual.'
        ),
    }
