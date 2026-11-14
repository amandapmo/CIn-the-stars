# Referências Científicas - CIn the Stars

**Dupla Responsável:** José Arthur e Mateus Costa (Ciência de Dados e Machine Learning)

**1. Tiemann et al. (2015)**
*   **Título:** Diversidade de rotações e processos do solo
*   **Periódico:** Ecology Letters | DOI: 10.1111/ele.12453
*   **Resultados Relevantes:** Evidencia que a alternância da profundidade das raízes e a inclusão de leguminosas melhoram a estrutura e a matéria orgânica do solo.
*   **Funcionalidade:** Algoritmo de scoring do motor de decisão (atribuição de +25 pontos para culturas que fixam nitrogênio após o cultivo de gramíneas exaustivas como o milho, e +15 pontos para sistema radicular profundo).
*   **Limitações:** Processos de recuperação estrutural do solo exigem longo prazo, mas o MVP aplica o princípio para a decisão imediata da próxima safra.

**2. NASA POWER Project**
*   **Instituição:** NASA (Prediction Of Worldwide Energy Resources)
*   **URL:** https://power.larc.nasa.gov/
*   **Funcionalidade:** Extração das variáveis `PRECTOTCORR` (Precipitação Corrigida) e `T2M_MIN` (Temperatura Mínima) para cálculo de anomalias hídricas sazonais e risco de geada (limiar < 5°C).
*   **Limitações:** Resolução espacial macro, necessitando validação do microclima e dos sensores do talhão pelo agricultor.

**3. FAOSTAT e Base de Dados FAO**
*   **Instituição:** Organização das Nações Unidas para a Alimentação e a Agricultura
*   **Funcionalidade:** Fornecimento dos parâmetros botânicos e limiares absolutos (temperatura ideal e demanda hídrica) para a construção da "Matriz Agronômica Global" de 15 culturas utilizada no filtro biofísico.