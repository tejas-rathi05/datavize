import operator
from RAG import RAG
from typing import List
from pydantic import BaseModel , Field
from langgraph.graph import StateGraph,END
from langchain_core.messages import BaseMessage
from typing import TypedDict, Annotated, Sequence
from langgraph.checkpoint.memory import InMemorySaver



class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]

class workflow:
    def __init__(self,llm,query,retriever,folder_path):
        self.llm = llm
        self.query = query
        self.retriever = retriever
        self.folder_path = folder_path
        self.memory=InMemorySaver()  ## memory is a class that stores the data of the session
    
    def application_workflow(self,state:AgentState):
        query = state["messages"][-1]
        obj = RAG(self.folder_path,self.retriever,self.llm)
        ans = obj.run(query)
        return {"messages" : [ans]}

    def Builder(self):
        builder=StateGraph(AgentState)
        ## adding nodes
        builder.add_node("RAG",self.application_workflow)
        builder.set_entry_point("RAG")
        #compiling
        app = builder.compile(checkpointer=self.memory)
        state={"messages":[self.query]}
        config={"configurable": {"thread_id": "1"}}
        result = app.invoke(state,config=config)
        return result["messages"][-1]




