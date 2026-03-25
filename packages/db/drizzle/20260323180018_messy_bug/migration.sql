DROP INDEX "courses_search_idx";--> statement-breakpoint
CREATE INDEX "courses_search_idx" ON "courses" USING bm25 ("id","name","register","courseNumber") WITH (key_field=id, text_fields='{
          "name": {"tokenizer": {"type": "ngram", "min_gram": 4, "max_gram": 5, "prefix_only": false}},
          "register": {"tokenizer": {"type": "ngram", "min_gram": 2, "max_gram": 4, "prefix_only": false}},
          "courseNumber": {"fast": true},
          "termId": {"fast": true}
        }');