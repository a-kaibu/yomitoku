---
title: "*.php のようなワイルドカードを、正規表現に読み替える"
description: "Symfony の Finder は、ファイルを探すときの *.php や src/**/*.js のようなパターン（glob）を、正規表現に変換します。1 文字ずつ読みながら、* や {a,b} の意味を置き換えていくのが見どころです。"
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/Finder/Glob.php
lines: [41, 90]
function: Glob::toRegex
difficulty: 3
format: 2
tags: [正規表現, パース, ファイル]
---

## ひとことで

`toRegex` は、ファイルを探すときに使う **glob パターン**（`*.php` や `src/**/*.js`）を、同じ意味の **正規表現** に変換する関数です。Symfony Finder は、この変換を使ってファイル名を照合しています。

## コード

::: code-group

```php:line-numbers=41 [日本語訳]
    public static function toRegex(string $glob, bool $strictLeadingDot = true, bool $strictWildcardSlash = true, string $delimiter = '#'): string
    {
        $firstByte = true;
        $escaping = false;
        $curlies = [];
        $bracketScanEnd = 0;
        $regex = '';
        if ($unanchored = str_starts_with($glob, '**/')) {
            $glob = '/'.$glob;
        }
        $sizeGlob = \strlen($glob);
        for ($i = 0; $i < $sizeGlob; ++$i) {
            $car = $glob[$i];
            if ($firstByte && $strictLeadingDot && '.' !== $car) {
                $regex .= '(?=[^\.])';
            }

            $firstByte = '/' === $car;

            if ($firstByte && $strictWildcardSlash && isset($glob[$i + 2]) && '**' === $glob[$i + 1].$glob[$i + 2] && (!isset($glob[$i + 3]) || '/' === $glob[$i + 3])) {
                $car = '[^/]++/';
                if (!isset($glob[$i + 3])) {
                    $car .= '?';
                }

                if ($strictLeadingDot) {
                    $car = '(?=[^\.])'.$car;
                }

                $car = '/(?:'.$car.')*';
                $i += 2 + isset($glob[$i + 3]);

                if ('/' === $delimiter) {
                    $car = str_replace('/', '\\/', $car);
                }
            }

            if ($delimiter === $car || '.' === $car || '(' === $car || ')' === $car || '|' === $car || '+' === $car || '^' === $car || '$' === $car) {
                $regex .= "\\$car";
            } elseif ('[' === $car && !$escaping && null !== $class = self::bracketExpressionToRegex($glob, $i, $strictWildcardSlash, $delimiter, $bracketScanEnd)) {
                $regex .= $class;
            } elseif ('*' === $car) {
                if ($escaping || $strictWildcardSlash || !str_ends_with($regex, '.*')) {
                    // ".*.*" は ".*" と同じ意味だが、後戻りの回数が二乗に増えるので避ける。
                    $regex .= $escaping ? '\\*' : ($strictWildcardSlash ? '[^/]*' : '.*');
                }
            } elseif ('?' === $car) {
                $regex .= $escaping ? '\\?' : ($strictWildcardSlash ? '[^/]' : '.');
            } elseif ('{' === $car) {
                if (!$escaping) {
```

```php:line-numbers=41 [原文]
    public static function toRegex(string $glob, bool $strictLeadingDot = true, bool $strictWildcardSlash = true, string $delimiter = '#'): string
    {
        $firstByte = true;
        $escaping = false;
        $curlies = [];
        $bracketScanEnd = 0;
        $regex = '';
        if ($unanchored = str_starts_with($glob, '**/')) {
            $glob = '/'.$glob;
        }
        $sizeGlob = \strlen($glob);
        for ($i = 0; $i < $sizeGlob; ++$i) {
            $car = $glob[$i];
            if ($firstByte && $strictLeadingDot && '.' !== $car) {
                $regex .= '(?=[^\.])';
            }

            $firstByte = '/' === $car;

            if ($firstByte && $strictWildcardSlash && isset($glob[$i + 2]) && '**' === $glob[$i + 1].$glob[$i + 2] && (!isset($glob[$i + 3]) || '/' === $glob[$i + 3])) {
                $car = '[^/]++/';
                if (!isset($glob[$i + 3])) {
                    $car .= '?';
                }

                if ($strictLeadingDot) {
                    $car = '(?=[^\.])'.$car;
                }

                $car = '/(?:'.$car.')*';
                $i += 2 + isset($glob[$i + 3]);

                if ('/' === $delimiter) {
                    $car = str_replace('/', '\\/', $car);
                }
            }

            if ($delimiter === $car || '.' === $car || '(' === $car || ')' === $car || '|' === $car || '+' === $car || '^' === $car || '$' === $car) {
                $regex .= "\\$car";
            } elseif ('[' === $car && !$escaping && null !== $class = self::bracketExpressionToRegex($glob, $i, $strictWildcardSlash, $delimiter, $bracketScanEnd)) {
                $regex .= $class;
            } elseif ('*' === $car) {
                if ($escaping || $strictWildcardSlash || !str_ends_with($regex, '.*')) {
                    // ".*.*" matches the same as ".*" but backtracks quadratically
                    $regex .= $escaping ? '\\*' : ($strictWildcardSlash ? '[^/]*' : '.*');
                }
            } elseif ('?' === $car) {
                $regex .= $escaping ? '\\?' : ($strictWildcardSlash ? '[^/]' : '.');
            } elseif ('{' === $car) {
                if (!$escaping) {
```

:::

## 前提知識

- **glob（グロブ）**: `*` や `?` を使ってファイル名を指定する書き方です。シェルで `ls *.txt` と打つときの書き方と同じ考え方です。
- **`*` と `?`**: `*` は 0 文字以上の任意の文字列、`?` は 1 文字の任意の文字を表すワイルドカードです。
- **エスケープ `\\`**: 次の 1 文字の特別な意味を打ち消す記号です。
- **先読み `(?=...)`**: 後ろに条件があるかを確かめるだけで、文字は読まない正規表現の書き方です。
- **`str_starts_with`**: 文字列が指定した文字で始まるかを調べる PHP の関数です。

## 何をしているか

### 1. 先頭の `**/` を、特別に扱う

```php:line-numbers=43
        $firstByte = true;
        $escaping = false;
        $curlies = [];
        $bracketScanEnd = 0;
        $regex = '';
        if ($unanchored = str_starts_with($glob, '**/')) {
            $glob = '/'.$glob;
        }
```

パターンが `**/` で始まるときは、どの深さのフォルダでも一致するように、先頭に `/` を付けておきます。

### 2. 1 文字ずつ、意味に応じて置き換える

```php:line-numbers=52
        for ($i = 0; $i < $sizeGlob; ++$i) {
            $car = $glob[$i];
            if ($firstByte && $strictLeadingDot && '.' !== $car) {
                $regex .= '(?=[^\.])';
            }

            $firstByte = '/' === $car;
```

`for` で 1 文字ずつ見ていきます。`$car` は今見ている文字です。`.` で始まらないファイルを除くため、先頭では `(?=[^\.])` を入れます。

::: code-group

```php:line-numbers=82 [日本語訳]
            } elseif ('*' === $car) {
                if ($escaping || $strictWildcardSlash || !str_ends_with($regex, '.*')) {
                    // ".*.*" は ".*" と同じ意味だが、後戻りの回数が二乗に増えるので避ける。
                    $regex .= $escaping ? '\\*' : ($strictWildcardSlash ? '[^/]*' : '.*');
                }
            } elseif ('?' === $car) {
                $regex .= $escaping ? '\\?' : ($strictWildcardSlash ? '[^/]' : '.');
```

```php:line-numbers=82 [原文]
            } elseif ('*' === $car) {
                if ($escaping || $strictWildcardSlash || !str_ends_with($regex, '.*')) {
                    // ".*.*" matches the same as ".*" but backtracks quadratically
                    $regex .= $escaping ? '\\*' : ($strictWildcardSlash ? '[^/]*' : '.*');
                }
            } elseif ('?' === $car) {
                $regex .= $escaping ? '\\?' : ($strictWildcardSlash ? '[^/]' : '.');
```

:::

`*` は、`/` 以外の任意の文字列を表す `[^/]*` に変えます。`?` は `[^/]` に変えます。このように、glob の記号 1 つが正規表現の 1 つの部品になります。

### 3. 波かっこと、カンマ

```php:line-numbers=89
            } elseif ('{' === $car) {
                if (!$escaping) {
                    $curlies[] = [\strlen($regex)];
                }
                $regex .= $escaping ? '\\{' : '(';
            } elseif ('}' === $car && $curlies) {
                $regex .= $escaping ? '}' : ')';
                if (!$escaping) {
                    array_pop($curlies);
                }
            } elseif (',' === $car && $curlies) {
                if (!$escaping) {
                    $curlies[\count($curlies) - 1][] = \strlen($regex);
                }
                $regex .= $escaping ? ',' : '|';
```

`{a,b}` は、`(a|b)` のように、`(`、`|`、`)` の組み合わせに変わります。`\` で始まる文字は、次の 1 文字をそのまま扱うためのエスケープです。

具体例として `*.php` は、先頭の `(?=[^\.])` と、`[^/]*`、そして `\.php` という部品からできた正規表現になります。

## ここがすごい

### 変換の規則を、表のように 1 つずつ書いている

glob の記号は少ないので、1 文字ずつ見て、対応する正規表現の部品を選ぶ方法が分かりやすい書き方です。`*` を `[^/]*` にするかどうかなど、細かい規則も、if の分岐として 1 か所にまとまっています。

### 「ディレクトリをまたぐ」`**` だけ特別扱い

`*` は `/` をまたがないのが、Finder の標準の動きです。`**/` だけは、フォルダを何段でもまたいで一致させる必要があるので、別の正規表現に置き換えています。同じ記号でも、位置によって意味が変わる点が丁寧に扱われています。

### 隠しファイルを、先頭の 1 文字で除く

先頭の `(?=[^\.])` は、`.` で始まる名前を除きます。Unix では `.` で始まるファイルは隠しファイルです。glob の標準の動きに合わせた、細かいけれど大事な配慮です。

## まとめ

- glob の記号は、1 文字ずつ正規表現の部品に置き換えると分かりやすい。
- 同じ記号でも、位置や文脈によって意味が変わる場合は、特別に扱う。
- 先読みの条件を先頭に置くと、隠しファイルのような例外を簡単に除ける。
- エスケープを状態として持つと、次の 1 文字だけ特別扱いできる。
