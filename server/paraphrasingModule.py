import os
import torch
from transformers import PegasusForConditionalGeneration, PegasusTokenizer
from keybert import KeyBERT
from sentence_splitter import SentenceSplitter
import nltk
from termcolor import colored

# Use NLTK's data downloader to download the required data packages (WordNet and Open Multilingual Wordnet) if not present already
for resource in ["wordnet", "omw-1.4"]:
    try:
        nltk_path = nltk.find("corpora/{0}".format(resource))
    except Exception:
        nltk.download(resource)

from nltk.corpus import wordnet


class PegasusParaphraser:
    def __init__(self, num_beams=10):
        self.module_dir = os.path.dirname(__file__)

        if(torch.cuda.is_available()):
            self.device = torch.device("cuda:0")
        else:
            self.device = torch.device("cpu:0")

        # Pegasus Tokenizer & Model for Paraphrasing
        print(colored("INFO", "green"),":\t  Loading Pegasus Tokenizer & Model for Paraphrasing.")
        paraphraser_model_name = "tuner007/pegasus_paraphrase"
        self.tokenizer = PegasusTokenizer.from_pretrained(paraphraser_model_name)
        self.model = PegasusForConditionalGeneration.from_pretrained(paraphraser_model_name).to(self.device)

        self.num_beams = num_beams

        self.splitter = SentenceSplitter(language='en')


    def paraphrase_text(self, text):
        sentence_list = self.splitter.split(text)
        batch = self.tokenizer(sentence_list,truncation=True, padding='longest', max_length=100, return_tensors="pt").to(self.device)
        translated = self.model.generate(**batch, max_length=60, num_beams=self.num_beams, num_return_sequences=1, temperature=1.5)
        tgt_text = self.tokenizer.batch_decode(translated, skip_special_tokens=True)

        paraphrased_text = " ".join(tgt_text)
        return paraphrased_text


class KeywordSynonyms:
    def __init__(self):
        # KeyBERT model for Keyword Extraction
        print(colored("INFO", "green"),":\t  Loading KeyBERT Model for Keyword Extraction.")
        self.keyword_extraction_model = KeyBERT()

    def extractKeywords(self, text):
        keywords = self.keyword_extraction_model.extract_keywords(text)
        # The output is of the format [('keyword1', 'score1'), ('keyword2', 'score2'), ...]
        return [x[0] for x in keywords]
    
    def getSynonyms(self, word, max_synonyms=6):
        synonyms = []
        for syn in wordnet.synsets(word):
            for l in syn.lemmas():
                synonyms.append(l.name().replace("_", " "))
                # Multi-word synonyms contain a '_' between the words, which needs to be replaced with a ' '
        
        return [x for x in list(set(synonyms)) if x.lower() != word.lower()][:max_synonyms] 
        # Consider those synonyms that are not the same as the original word
    
    def getSynonymsForKeywords(self, text, max_synonyms=6):
        keywords = self.extractKeywords(text)
        kw_syn = {}
        for word in keywords:
            synonyms = self.getSynonyms(word, max_synonyms)
            if len(synonyms) > 0: 
                kw_syn[word] = synonyms

        return kw_syn