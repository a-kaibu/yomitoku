---
title: "検索語の前後だけを切り出して、文章の抜粋を作る"
description: "Laravel の Str::excerpt は、長い本文から検索語の前後の部分だけを抜き出します。前後の文字数を指定でき、途中を省略したことを「...」で示します。"
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Support/Str.php
lines: [461, 487]
function: Str::excerpt
difficulty: 3
format: 2
tags: [文字列処理, 正規表現, Unicode]
---

## ひとことで

`Str::excerpt` は、長い本文の中から **検索語（フレーズ）の前後の一部** だけを抜き出します。検索結果の一覧で「...キーワードを含む文...」のように表示する抜粋を作るときに使われます。

## コード

```php:line-numbers=461
    public static function excerpt($text, $phrase = '', $options = [])
    {
        $radius = $options['radius'] ?? 100;
        $omission = $options['omission'] ?? '...';

        preg_match('/^(.*?)('.preg_quote((string) $phrase, '/').')(.*)$/iu', (string) $text, $matches);

        if (empty($matches)) {
            return null;
        }

        $start = ltrim($matches[1]);

        $start = (new Stringable(mb_substr($start, max(mb_strlen($start, 'UTF-8') - $radius, 0), $radius, 'UTF-8')))->ltrim()->unless(
            fn ($startWithRadius) => $startWithRadius->exactly($start),
            fn ($startWithRadius) => $startWithRadius->prepend($omission),
        );

        $end = rtrim($matches[3]);

        $end = (new Stringable(mb_substr($end, 0, $radius, 'UTF-8')))->rtrim()->unless(
            fn ($endWithRadius) => $endWithRadius->exactly($end),
            fn ($endWithRadius) => $endWithRadius->append($omission),
        );

        return $start->append($matches[2], $end)->toString();
    }
```

## 前提知識

- **正規表現の `(.*?)`**: `?` を付けた `.*` は、できるだけ短く一致させる書き方です（最短一致）。
- **`preg_quote`**: 正規表現の特別な文字（`.` や `*` など）を、普通の文字として扱えるようにエスケープする関数です。
- **`i` と `u` の修飾子**: `i` は大文字小文字を区別しない、`u` は UTF-8 として扱う指定です。
- **`Stringable`**: Laravel の文字列を、メソッドをつないで扱えるようにしたクラスです。
- **`mb_substr`**: マルチバイト文字に対応した部分文字列の関数です。

## 何をしているか

### 1. 検索語の位置で、本文を 3 つに分ける

```php:line-numbers=466
        preg_match('/^(.*?)('.preg_quote((string) $phrase, '/').')(.*)$/iu', (string) $text, $matches);

        if (empty($matches)) {
            return null;
        }
```

`preg_quote` で検索語を安全な形にしてから、`^(.*?)(検索語)(.*)$` という正規表現で本文を 3 つに分けます。`$matches[1]` が検索語より前、`$matches[2]` が検索語、`$matches[3]` が検索語より後ろです。見つからなければ `null` を返します。

### 2. 前の部分は、末尾の `$radius` 文字だけを残す

```php:line-numbers=472
        $start = ltrim($matches[1]);

        $start = (new Stringable(mb_substr($start, max(mb_strlen($start, 'UTF-8') - $radius, 0), $radius, 'UTF-8')))->ltrim()->unless(
            fn ($startWithRadius) => $startWithRadius->exactly($start),
            fn ($startWithRadius) => $startWithRadius->prepend($omission),
        );
```

前の部分（`$matches[1]`）は、後ろから `$radius` 文字だけを切り出します。切った結果が元の前の部分と同じでなければ、途中から切ったので先頭に `...` を付けます。`unless` は、条件を満たさないときだけ 2 つ目の関数を実行する Laravel の書き方です。

### 3. 後ろの部分も同じように切る

```php:line-numbers=479
        $end = rtrim($matches[3]);

        $end = (new Stringable(mb_substr($end, 0, $radius, 'UTF-8')))->rtrim()->unless(
            fn ($endWithRadius) => $endWithRadius->exactly($end),
            fn ($endWithRadius) => $endWithRadius->append($omission),
        );
```

後ろの部分は、先頭から `$radius` 文字を取ります。切っていれば末尾に `...` を付けます。

### 4. 3 つをつなげて返す

```php:line-numbers=486
        return $start->append($matches[2], $end)->toString();
```

`append` で、前の部分・検索語・後ろの部分をつなげて文字列にして返します。

## ここがすごい

### 前後を別々に切るので、どちらも同じ基準で省略できる

前の部分は「末尾の何文字か」、後ろの部分は「先頭の何文字か」を残します。検索語を中心にして、左右が同じ長さの窓になるように切っているので、どこにキーワードがあっても読みやすい抜粋になります。

### 「省略したときだけ記号を付ける」

```php:line-numbers=474
        $start = (new Stringable(mb_substr($start, max(mb_strlen($start, 'UTF-8') - $radius, 0), $radius, 'UTF-8')))->ltrim()->unless(
            fn ($startWithRadius) => $startWithRadius->exactly($start),
            fn ($startWithRadius) => $startWithRadius->prepend($omission),
        );
```

切らずに済んだ場合は、`...` を付けません。`unless` と `exactly` で、「元と同じか」を確かめてから付け足しています。短い文章でも、余計な `...` が付かないのはこの工夫のおかげです。

### 検索語をエスケープしてから使う

検索語に `.` や `(` のような記号が入っていても、そのまま正規表現の部分に入るとおかしくなります。`preg_quote` で記号を無効にしてから埋め込むことで、どんな検索語でも正しく動きます。

## まとめ

- 検索語の前後を切り出すときは、正規表現で 3 つに分けると手順が明快になる。
- 最短一致の `(.*?)` を使うと、最初に見つかった位置で区切れる。
- 検索語は `preg_quote` でエスケープしてから正規表現に入れる。
- 省略したときだけ記号を付けると、短い文章でも自然に読める。
