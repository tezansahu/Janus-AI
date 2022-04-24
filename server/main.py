from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import paraphrasingModule

# Load the paraphrasing, keyword extraction and synonym finding modules
paraphraser = paraphrasingModule.PegasusParaphraser()
kw_syn = paraphrasingModule.KeywordSynonyms()

# User's input text is sent as a request body. The structure of this body can be defined by extending Pydantic's BaseModel
class Paragraph(BaseModel):
    paragraph: str
# The model above declares a JSON object (or Python dict) like:
# {
#     "paragraph": "user's input text"
# }

# Initialize the FastAPI application
app = FastAPI()

# Allow Cross-Origin Resource Sharing (CORS) requests to from any host so that the JavaScript in the extension can communicate with the server
# To learn more about CORS, check out https://medium.com/@reemshakes/how-does-cors-work-f7488acf09f4
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

# API root
@app.get("/")
def get_root():
    return "This is the RESTful API for Janus AI"

# POST endpoint with path '/paraphrase'
@app.post("/paraphrase")
async def paraphrase_text(text: Paragraph):
    paraphrased_text = paraphraser.paraphrase_text(text.paragraph)

    return {
        "original": text.paragraph,
        "paraphrased": paraphrased_text,
        "keywords_synonyms": kw_syn.getSynonymsForKeywords(paraphrased_text)
    }