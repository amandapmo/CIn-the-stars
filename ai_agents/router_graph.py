import sys
import os
import json
from typing import TypedDict, List, Dict, Any
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from data_ml.src.rotation_engine import generate_mvp_recommendation

# Load environment variables explicitly from the ai_agents folder
load_dotenv("ai_agents/.env")

# Initialize Groq
llm = ChatGroq(model="openai/gpt-oss-20b", temperature=0.2)

# The State (the shared notebook passed between agents)
class AgentState(TypedDict):
    chat_history: List[dict]       
    farmer_question: str
    lat: float             
    lon: float             
    previous_crop: str     
    has_image: bool
    rotation_engine_data: str  
    market_data: str
    leaf_diagnosis: Dict[str, Any] 
    final_response: str

# The Nodes (Jean's drawn agents)
def agent_decision(state: AgentState):
    print("Decision Agent: Evaluating the question and triggering the REAL ML engine...")
    
    lat = state.get("lat")
    lon = state.get("lon")
    prev_crop = state.get("previous_crop")
    
    print(f"Querying NASA via Rotation Engine for Lat: {lat}, Lon: {lon}...")
    
    # Real call to the rotation engine
    try:
        engine_result = generate_mvp_recommendation(lat=lat, lon=lon, previous_crop=prev_crop)
        # Store real JSON in state for the explication agent
        return {"rotation_engine_data": json.dumps(engine_result)}
    except Exception as e:
        return {"rotation_engine_data": f"Error communicating with NASA Engine: {str(e)}"}

def agent_research(state: AgentState):
    print("Research Agent: Searching for external context via Google API...")
    return state

def agent_market(state: AgentState):
    print("Market Agent: Analyzing current prices for the recommended crop...")
    return {"market_data": "The market price for the recommended crop is trending up by 12% this season."}

def agent_leaf(state: AgentState):
    if state.get("has_image"):
        print("Leaf Agent: Triggering Computer Vision (Waiting for Jean's YOLO)...")
        # Simulating the JSON output from Jean's YOLO model
        return {
            "leaf_diagnosis": {
                "status": "infected",
                "disease_detected": "Asian Soybean Rust",
                "confidence_score": 0.92
            }
        }
    return state

def agent_explication(state: AgentState):
    print("Explication Agent: Translating context, NASA JSON, and YOLO into simple terms...")
    
    engine_data = state.get("rotation_engine_data", "")
    market_data = state.get("market_data", "")
    leaf_data = state.get("leaf_diagnosis", {})
    chat_history = state.get("chat_history", [])
    
    prompt = f"""
    You are an expert agronomic assistant. Translate the technical data into a simple, practical response for a farmer.

    Chat Context (Previous Messages): {chat_history}
    Technical Data (NASA & FAO): {engine_data}
    Market Context: {market_data}
    Leaf Scan Diagnostics (YOLO Model): {leaf_data}

    Write a short paragraph in English explaining what they should do based on the soil, climate, market, and any detected leaf diseases. Keep it simple and actionable.
    """
    
    response = llm.invoke([SystemMessage(content=prompt)])
    return {"final_response": response.content}

# The Graph (Tying the workflow together)
workflow = StateGraph(AgentState)

workflow.add_node("decision", agent_decision)
workflow.add_node("research", agent_research)
workflow.add_node("market", agent_market)
workflow.add_node("leaf", agent_leaf)
workflow.add_node("explication", agent_explication)

workflow.set_entry_point("decision")
workflow.add_edge("decision", "research")
workflow.add_edge("research", "market")
workflow.add_edge("research", "leaf") 
workflow.add_edge("market", "explication")
workflow.add_edge("leaf", "explication")
workflow.add_edge("explication", END)

app = workflow.compile()

if __name__ == "__main__":
    print("Starting LangGraph flow with REAL NASA Engine & YOLO prep...\n")
    
    # Testing full flow with image and chat history
    initial_input = {
        "chat_history": [{"role": "user", "content": "My plants look sick today."}],
        "farmer_question": "What is wrong with my leaves and what should I plant next in Sinop?",
        "lat": -11.8643,
        "lon": -55.5059,
        "previous_crop": "Cassava",
        "has_image": True 
    }
    
    final_state = None
    for output in app.stream(initial_input):
        for key, value in output.items():
            final_state = value
            
    print("\n" + "*"*50)
    print("GROQ FINAL RESPONSE:")
    print("*"*50)
    print(final_state.get("final_response"))