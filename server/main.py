from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import paraphrasingModule

paraphraser = paraphrasingModule.PegasusParaphraser()
kw_syn = paraphrasingModule.KeywordSynonyms()

class Paragraph(BaseModel):
    paragraph: str

class Word(BaseModel):
    word: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

@app.get("/")
def get_root():
    return "This is the RESTful API for Janus AI"

@app.post("/paraphrase/")
async def paraphrase_text(text: Paragraph):
    paraphrased_text = paraphraser.paraphrase_text(text.paragraph)

    return {
        "original": text.paragraph,
        "paraphrased": paraphrased_text,
        "keywords_synonyms": kw_syn.getSynonymsForKeywords(paraphrased_text)
    }

@app.post("/synonym/")
async def get_synonyms_of_word(word: Word):
    return {
        "word": word.word,
        "synonyms": kw_syn.getSynonyms(word.word)
    }