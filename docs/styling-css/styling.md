# Styling

SearchNEU is powered by Sass. Sass is a superscript of CSS that provides some really nice features that help us with keeping our styles consistent and distinct.

If you're unfamiliar with Sass, I'd highly recommend checking out their [getting started page][sass-getting-started].

## Layout

All our styling files are in `/styles`, and are parallel to the content in `/components`. Partials, `.scss` files whose first character is an underscore `_`, should never affect styles outside that specific file. To resolve this, we must namespace and ecapsulate our styles. Practically, this means that every partial should have one root style, and all styling is nested within that style.

## Exceptions

There are three exceptions to the above layout, `css/base.scss`, `_variables.scss`, and `_zIndexes.css`. The variables partial keeps track of all our common themes and colors. This file is imported first, so all following partials can use any variables.

`base.scss` itself has two purposes, 1) to import any partial styles, and 2) normalizing styles. This file should not contain anything else.

## Z-Indexes

In addition to utilizing variables for themes and colors, we use variables for our Z-indexes as well. Located in `/styles` in the `_zIndexes.scss` partial, our Z-index levels range from 1-15 and should be used instead of raw index numbers.

## Adding new styles

Adding a new style file is easy. First, create a Sass file that reflects the file path relative to the `components` folder. Make sure it's a partial (`_<FileName>.scss`). Next, import it in `base.scss`. Finally, make sure you namespace that file. We do not like having leaking styles! :c

[sass-getting-started]: http://sass-lang.com/guide
