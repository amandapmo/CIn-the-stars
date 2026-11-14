# Metodologia - CIn the Stars

**Dupla Responsável:** José Arthur e Mateus Costa (Ciência de Dados e Machine Learning)

## 1. Problema Investigado e Variáveis
O motor de decisão resolve a dificuldade de cruzar dados climáticos reais com necessidades biológicas. Utilizamos dados da **NASA POWER API** (Agregados em janelas de 3 meses para `chuva_safra_3m_mm` e `temp_min_safra_3m_c`) cruzados com uma **Matriz Agronômica** construída via FAO.
    
## 2. Limpeza e Processamento (Pandas)
As falhas do satélite (-999) foram removidas e interpoladas linearmente via Pandas. A granularidade diária (`DOY`) foi convertida em médias mensais e posteriormente agregada em uma "Janela Sazonal Móvel de 3 meses", refletindo o ciclo real de uma safra.

## 3. Métodos e Algoritmos Empregados
Adotamos um sistema determinístico baseado em filtros e pesos (Scoring) para garantir explicabilidade, evitando o efeito "caixa preta" de redes neurais genéricas:
1.  **Hard Filters (Filtros Biofísicos):** Máscaras booleanas excluem culturas onde a previsão de chuva ou temperatura da NASA está fora dos limiares de tolerância da planta.
2.  **Scoring de Rotação:** O algoritmo avalia a cultura anterior e aplica bonificações matemáticas para plantas da nova safra que quebram o ciclo de pragas (diferente família botânica) e recuperam o solo (ex: leguminosas fixadoras de nitrogênio).

## 4. Limitações
A classificação de risco hídrico e térmico é baseada em médias históricas e dados espaciais agregados do satélite. O protótipo serve como suporte à decisão macro, não substituindo a análise laboratorial do solo e o monitoramento microclimático da propriedade.