import pandas as pd
import json

# ==========================================
# 1. MATRIZ AGRONÔMICA (Frente 2 - Ciência de Dados)
# ==========================================
dados_culturas = [
    {"cultura": "Feijão Macassar", "exigencia_hidrica": "Média", "fixa_nitrogenio": True, "profundidade_raiz": "Rasa", "ciclo_dias": 75},
    {"cultura": "Mandioca", "exigencia_hidrica": "Baixa", "fixa_nitrogenio": False, "profundidade_raiz": "Profunda", "ciclo_dias": 240},
    {"cultura": "Milho", "exigencia_hidrica": "Alta", "fixa_nitrogenio": False, "profundidade_raiz": "Rasa", "ciclo_dias": 120},
    {"cultura": "Palma Forrageira", "exigencia_hidrica": "Baixa", "fixa_nitrogenio": False, "profundidade_raiz": "Rasa", "ciclo_dias": 365}
]
df_culturas = pd.DataFrame(dados_culturas)

# ==========================================
# 2. MOTOR DE DECISÃO & LEITURA CLIMÁTICA 
# ==========================================
def gerar_recomendacao_mvp(caminho_arquivo, cultura_anterior):
    # Lê o arquivo já processado pelas células anteriores
    df_clima = pd.read_csv(caminho_arquivo)
    
    # Médias climáticas usando as colunas agregadas corretas
    temp_min_historica = df_clima['temp_min_extrema_c'].mean()
    chuva_media_diaria = (df_clima['chuva_mensal_media_mm'].mean()) / 30  # Divide por 30 para ter a média diária
    
    # Classificação do clima
    risco_geada = "Nulo" if temp_min_historica > 5 else "Alto"
    previsao_chuva = "Baixa" if chuva_media_diaria < 2 else ("Média" if chuva_media_diaria < 5 else "Alta")
    
    df_rank = df_culturas.copy()
    df_rank['score'] = 50 
    df_rank['justificativa'] = ""
    
    for idx, row in df_rank.iterrows():
        justificativas = []
        
        # Filtro 1: Resiliência Hídrica
        if previsao_chuva == "Baixa" and row['exigencia_hidrica'] == "Baixa":
            df_rank.at[idx, 'score'] += 30
            justificativas.append("Tolera a baixa umidade prevista pelos dados da NASA")
        elif previsao_chuva == "Baixa" and row['exigencia_hidrica'] == "Alta":
            df_rank.at[idx, 'score'] -= 40
            justificativas.append("Alto risco de quebra de safra por déficit hídrico")
            
        # Filtro 2: Rotação de Culturas e Solo
        if cultura_anterior == "Milho":
            if row['fixa_nitrogenio']:
                df_rank.at[idx, 'score'] += 25
                justificativas.append("Fixa nitrogênio (recupera solo esgotado pelo Milho)")
            if row['profundidade_raiz'] == "Profunda":
                df_rank.at[idx, 'score'] += 15
                justificativas.append("Sistema radicular profundo acessa nutrientes intocados pelo Milho")
                
        df_rank.at[idx, 'justificativa'] = " e ".join(justificativas) if justificativas else "Apta para plantio regular"
        
    df_rank = df_rank.sort_values(by='score', ascending=False).reset_index(drop=True)
    melhor_opcao = df_rank.iloc[0]
    
    payload_frontend = {
        "cultura_sugerida": melhor_opcao['cultura'],
        "risco_geada": risco_geada,
        "justificativa": melhor_opcao['justificativa']
    }
    
    return json.dumps(payload_frontend, indent=2, ensure_ascii=False)

# ==========================================
# 3. TESTE DA API 
# ==========================================
arquivo_petrolina = "clima_sazonal_petrolina.csv"

json_para_o_app = gerar_recomendacao_mvp(arquivo_petrolina, cultura_anterior="Milho")
print(json_para_o_app)