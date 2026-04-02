CREATE INDEX "building_search_idx" ON "buildings" USING bm25 ("id","name","code") WITH (key_field=id,text_fields='{
          "name": {"tokenizer": {"type": "ngram", "min_gram": 3, "max_gram": 5, "prefix_only": false}},
          "code": {"tokenizer": {"type": "ngram", "min_gram": 3, "max_gram": 5, "prefix_only": false}}
        }');