---
title: タイトルを、URL に使える英数字の並びに変える
description: Symfony の AsciiSlugger::slug は、「Héllo Wörld!」のような文字列を「Hello-World」のような URL 向けの形に変えます。アクセント記号、記号、言語ごとの読み替えを段階ごとに行います。
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/String/Slugger/AsciiSlugger.php
lines: [104, 150]
function: AsciiSlugger::slug
difficulty: 3
format: 2
tags: [文字列処理, Unicode, API設計]
---

## ひとことで

`slug` は、記事のタイトルなどを、URL やファイル名に使える **英数字とハイフンだけの文字列**（スラッグ）に変換します。`é` は `e` に、`&` は `and` のように、読み方も含めて変えられるのが特徴です。

## コード

::: code-group

```php:line-numbers=104 [日本語訳]
    public function slug(string $string, string $separator = '-', ?string $locale = null): AbstractUnicodeString
    {
        $locale ??= $this->defaultLocale;

        $transliterator = [];
        if ($locale && ('de' === $locale || str_starts_with($locale, 'de_') || str_starts_with($locale, 'de-'))) {
            // 近道: UnicodeString::ascii() のドイツ語用の処理を使う（速く、intl が要らない）
            $transliterator = ['de-ASCII'];
        } elseif (\function_exists('transliterator_transliterate') && $locale) {
            $transliterator = (array) $this->createTransliterator($locale);
        }

        if ($emojiTransliterator = $this->createEmojiTransliterator($locale)) {
            $transliterator[] = $emojiTransliterator;
        }

        if ($this->symbolsMap instanceof \Closure) {
            // シンボルマップがクロージャで渡された場合は、親のロケールへのフォールバックは不要。
            // クロージャが、関心のあるすべてのロケールの置き換えを提供できるため。
            $symbolsMap = $this->symbolsMap;
            array_unshift($transliterator, static fn ($s) => $symbolsMap($s, $locale));
        }

        $unicodeString = (new UnicodeString($string))->ascii($transliterator);

        if (\is_array($this->symbolsMap)) {
            $map = null;
            if (isset($this->symbolsMap[$locale ?? ''])) {
                $map = $this->symbolsMap[$locale ?? ''];
            } else {
                $parent = self::getParentLocale($locale);
                if ($parent && isset($this->symbolsMap[$parent])) {
                    $map = $this->symbolsMap[$parent];
                }
            }
            if ($map) {
                foreach ($map as $char => $replace) {
                    $unicodeString = $unicodeString->replace($char, ' '.$replace.' ');
                }
            }
        }

        return $unicodeString
            ->replaceMatches('/[^A-Za-z0-9]++/', $separator)
            ->trim($separator)
        ;
    }
```

```php:line-numbers=104 [原文]
    public function slug(string $string, string $separator = '-', ?string $locale = null): AbstractUnicodeString
    {
        $locale ??= $this->defaultLocale;

        $transliterator = [];
        if ($locale && ('de' === $locale || str_starts_with($locale, 'de_') || str_starts_with($locale, 'de-'))) {
            // Use the shortcut for German in UnicodeString::ascii() if possible (faster and no requirement on intl)
            $transliterator = ['de-ASCII'];
        } elseif (\function_exists('transliterator_transliterate') && $locale) {
            $transliterator = (array) $this->createTransliterator($locale);
        }

        if ($emojiTransliterator = $this->createEmojiTransliterator($locale)) {
            $transliterator[] = $emojiTransliterator;
        }

        if ($this->symbolsMap instanceof \Closure) {
            // If the symbols map is passed as a closure, there is no need to fallback to the parent locale
            // as the closure can just provide substitutions for all locales of interest.
            $symbolsMap = $this->symbolsMap;
            array_unshift($transliterator, static fn ($s) => $symbolsMap($s, $locale));
        }

        $unicodeString = (new UnicodeString($string))->ascii($transliterator);

        if (\is_array($this->symbolsMap)) {
            $map = null;
            if (isset($this->symbolsMap[$locale ?? ''])) {
                $map = $this->symbolsMap[$locale ?? ''];
            } else {
                $parent = self::getParentLocale($locale);
                if ($parent && isset($this->symbolsMap[$parent])) {
                    $map = $this->symbolsMap[$parent];
                }
            }
            if ($map) {
                foreach ($map as $char => $replace) {
                    $unicodeString = $unicodeString->replace($char, ' '.$replace.' ');
                }
            }
        }

        return $unicodeString
            ->replaceMatches('/[^A-Za-z0-9]++/', $separator)
            ->trim($separator)
        ;
    }
```

:::

## 前提知識

- **スラッグ**: URL の一部に使う、読みやすい短い文字列です。`my-first-post` のような形です。
- **Unicode 文字列**: 日本語やアクセント記号を含む、世界中の文字を扱える文字列です。
- **トランスリタレーション（翻字）**: ある文字を、別の文字（たとえばラテン文字）に読み替えることです。`é` を `e` にするなどです。
- **正規表現の `++`（所有的量指定子）**: 一致した文字を後から戻さない書き方です。同じ区切りの連続を 1 つにまとめる目的で使われています。
- **ロケール**: 言語や地域の設定です。`de` はドイツ語、`de_AT` のように地域を含むこともあります。

## 何をしているか

### 1. 言語ごとの読み替えを用意する

::: code-group

```php:line-numbers=106 [日本語訳]
        $locale ??= $this->defaultLocale;

        $transliterator = [];
        if ($locale && ('de' === $locale || str_starts_with($locale, 'de_') || str_starts_with($locale, 'de-'))) {
            // 近道: UnicodeString::ascii() のドイツ語用の処理を使う（速く、intl が要らない）
            $transliterator = ['de-ASCII'];
        } elseif (\function_exists('transliterator_transliterate') && $locale) {
            $transliterator = (array) $this->createTransliterator($locale);
        }
```

```php:line-numbers=106 [原文]
        $locale ??= $this->defaultLocale;

        $transliterator = [];
        if ($locale && ('de' === $locale || str_starts_with($locale, 'de_') || str_starts_with($locale, 'de-'))) {
            // Use the shortcut for German in UnicodeString::ascii() if possible (faster and no requirement on intl)
            $transliterator = ['de-ASCII'];
        } elseif (\function_exists('transliterator_transliterate') && $locale) {
            $transliterator = (array) $this->createTransliterator($locale);
        }
```

:::

ロケール（言語の指定）が `de` のときは、ドイツ語用の近道を使います。それ以外で `intl` 拡張が使えるときは、言語に合った翻字の仕組みを作ります。ここでは、まだ変換は行いません。

### 2. 記号を、単語に置き換える

::: code-group

```php:line-numbers=120 [日本語訳]
        if ($this->symbolsMap instanceof \Closure) {
            // シンボルマップがクロージャで渡された場合は、親のロケールへのフォールバックは不要。
            // クロージャが、関心のあるすべてのロケールの置き換えを提供できるため。
            $symbolsMap = $this->symbolsMap;
            array_unshift($transliterator, static fn ($s) => $symbolsMap($s, $locale));
        }

        $unicodeString = (new UnicodeString($string))->ascii($transliterator);

        if (\is_array($this->symbolsMap)) {
            $map = null;
            if (isset($this->symbolsMap[$locale ?? ''])) {
                $map = $this->symbolsMap[$locale ?? ''];
            } else {
                $parent = self::getParentLocale($locale);
                if ($parent && isset($this->symbolsMap[$parent])) {
                    $map = $this->symbolsMap[$parent];
                }
            }
            if ($map) {
                foreach ($map as $char => $replace) {
                    $unicodeString = $unicodeString->replace($char, ' '.$replace.' ');
                }
            }
        }
```

```php:line-numbers=120 [原文]
        if ($this->symbolsMap instanceof \Closure) {
            // If the symbols map is passed as a closure, there is no need to fallback to the parent locale
            // as the closure can just provide substitutions for all locales of interest.
            $symbolsMap = $this->symbolsMap;
            array_unshift($transliterator, static fn ($s) => $symbolsMap($s, $locale));
        }

        $unicodeString = (new UnicodeString($string))->ascii($transliterator);

        if (\is_array($this->symbolsMap)) {
            $map = null;
            if (isset($this->symbolsMap[$locale ?? ''])) {
                $map = $this->symbolsMap[$locale ?? ''];
            } else {
                $parent = self::getParentLocale($locale);
                if ($parent && isset($this->symbolsMap[$parent])) {
                    $map = $this->symbolsMap[$parent];
                }
            }
            if ($map) {
                foreach ($map as $char => $replace) {
                    $unicodeString = $unicodeString->replace($char, ' '.$replace.' ');
                }
            }
        }
```

:::

`symbolsMap` は、「記号 → 言葉」の対応表です。たとえば `&` を `and` に読ませることができます。ロケールに合う表がなければ、親のロケール（`de_AT` なら `de`）の表を探します。見つかった記号は、前後に空白を入れた単語に置き換えます。

### 3. アクセントを外し、英数字以外を区切りにする

```php:line-numbers=127
        $unicodeString = (new UnicodeString($string))->ascii($transliterator);
```

`(new UnicodeString($string))->ascii($transliterator)` で、`é` のようなアクセント付きの文字を英字に直します。

```php:line-numbers=146
        return $unicodeString
            ->replaceMatches('/[^A-Za-z0-9]++/', $separator)
            ->trim($separator)
        ;
```

最後に、英数字以外の文字の並び（`[^A-Za-z0-9]++`）を区切り文字（既定値は `-`）に置き換えます。先頭と末尾の区切りは `trim` で取り除きます。

具体例として `Héllo Wörld!` は、`Hello World!` を経て、`Hello-World` になります。

## ここがすごい

### 変換を、段階ごとに分けている

まず言語の読み替え、次に記号の単語化、最後に英数字以外の区切り、というように段階を分けています。どの段階も、前の段階の結果を受け取るだけなので、途中の結果を確かめやすい書き方です。

### 「言語に合った読み方」を、最初に選べる

同じ `&` でも、言語によっては `und`（ドイツ語）や `et`（フランス語）と読むのが自然です。ロケールを先に決めて、対応表を切り替えることで、読みやすい結果になります。親のロケールを探す仕組みは、`de_AT` のような細かい指定でも、`de` の表を使えるようにするための工夫です。

### 最後に、まとめて区切りに置き換える

記号を 1 つずつ処理するのではなく、英数字以外の並びを一度に区切りにするので、`Hello!!  World` のような入力でも `Hello-World` になります。`++` で連続をまとめるのが、この関数の簡潔さの理由です。

## まとめ

- URL 用の文字列は、アクセントの除去と記号の変換を段階ごとに分けると組み立てやすい。
- 記号の読み替えは言語に依存するので、ロケールから対応表を選ぶ。
- 英数字以外の並びを一度にまとめて区切りにすると、連続した記号も 1 つになる。
- 結果は Unicode 文字列として返すので、必要に応じて小文字化などを続けられる。
