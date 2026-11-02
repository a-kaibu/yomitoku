---
title: "区切りの文字を取り除いて、単語の頭だけ大文字にする"
description: "Laravel の Str::studly は、user_profile_id のような名前を UserProfileId に変えます。正規表現で単語を分け、結果を覚えておく工夫がある変換関数です。"
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Support/Str.php
lines: [1830, 1851]
function: Str::studly
difficulty: 2
format: 2
tags: [文字列処理, 正規表現, キャッシュ]
---

## ひとことで

`Str::studly` は、`user_profile` や `user-profile` のように `_` や `-` でつないだ名前を、**単語の頭だけ大文字にして続ける** `UserProfile` の形に変えます。クラス名を作るときによく使われる形です。

## コード

```php:line-numbers=1830
    public static function studly($value, bool $normalize = false)
    {
        if ($normalize) {
            $value = preg_replace_callback(
                '/(^|[-_ \s])([A-Z]+)(?=[-_ \s]|$)/u',
                fn ($m) => $m[1].static::lower($m[2]),
                $value
            );
        }

        $key = $value;

        if (isset(static::$studlyCache[$key])) {
            return static::$studlyCache[$key];
        }

        $words = preg_split('/\s+/u', static::replace(['-', '_'], ' ', $value), -1, PREG_SPLIT_NO_EMPTY);

        $studlyWords = array_map(fn ($word) => static::ucfirst($word), $words);

        return static::$studlyCache[$key] = implode('', $studlyWords);
    }
```

## 前提知識

- **パスカルケース（スタディリーケース）**: 単語の頭をすべて大文字にして、区切りを付けずに続ける書き方です。`UserProfile` のような形です。
- **`preg_split`**: 正規表現で文字列を区切って、配列にする関数です。
- **`preg_replace_callback`**: 正規表現で見つけた部分ごとに、関数で変換する関数です。
- **`array_map`**: 配列の要素を 1 つずつ関数で変換する関数です。
- **`implode`**: 配列の要素を、区切り文字なし（空文字）でつなぐ関数です。

## 何をしているか

### 1. 必要なら、大文字の並びをふつうの語に直す

```php:line-numbers=1832
        if ($normalize) {
            $value = preg_replace_callback(
                '/(^|[-_ \s])([A-Z]+)(?=[-_ \s]|$)/u',
                fn ($m) => $m[1].static::lower($m[2]),
                $value
            );
        }
```

`$normalize` が `true` のときは、`API_KEY` のような全部大文字の単語を、小文字に直してから進みます。正規表現 `/(^|[-_ \s])([A-Z]+)(?=[-_ \s]|$)/u` は、区切りの後ろにある大文字の並びを見つけて、その部分だけ小文字にします。

### 2. 計算済みならキャッシュから返す

```php:line-numbers=1840
        $key = $value;

        if (isset(static::$studlyCache[$key])) {
            return static::$studlyCache[$key];
        }
```

結果は `$studlyCache` に覚えておきます。同じ名前を何度変換しても、2 回目からは計算しません。

### 3. `_` と `-` を空白に変えて、単語に分ける

```php:line-numbers=1846
        $words = preg_split('/\s+/u', static::replace(['-', '_'], ' ', $value), -1, PREG_SPLIT_NO_EMPTY);
```

`static::replace(['-', '_'], ' ', $value)` で、区切りの `_` と `-` を空白に変えます。そのうえで `preg_split('/\s+/u', ...)` で単語の配列にします。`PREG_SPLIT_NO_EMPTY` を付けているので、連続した区切りでも空の単語は入りません。

### 4. 単語ごとに頭を大文字にして、つなぐ

```php:line-numbers=1848
        $studlyWords = array_map(fn ($word) => static::ucfirst($word), $words);

        return static::$studlyCache[$key] = implode('', $studlyWords);
```

`array_map` で各単語の頭を大文字にし（`ucfirst` 相当）、`implode('', ...)` で区切りなしにつなげます。最後の代入で結果をキャッシュに入れてから返します。

具体例として `user_profile-id` は、区切りを空白にして `user profile id`、単語ごとに頭を大文字にして `UserProfileId` になります。`API_KEY` は、先に `api_key` に直してから、`ApiKey` になります。

## ここがすごい

### 区切りの変換と、単語の処理を分けている

「区切りを空白にする」「単語に分ける」「頭を大文字にする」「つなぐ」という 4 段階が、それぞれ 1 行で書かれています。途中の結果は配列や文字列として見えるので、どこで何が変わったかを追いやすくなっています。

### 大文字の略語を、あとで崩せる

`normalize` の処理は、`API` のような略語を `Api` に直すための任意の処理です。何もしなければ元の形のまま変換されます。使う側が選べるように、オプションとして分けている点が読みやすさにつながっています。

### 変換結果をキャッシュする理由

クラス名やメソッド名の変換は、同じ名前で何度も行われます。キャッシュがあれば、正規表現による分割を繰り返さずに済みます。`Str::snake` の記事で見たキャッシュと同じ考え方です。

## まとめ

- 区切りの変換は、空白に置き換えてから単語に分けると扱いやすい。
- 単語の頭だけ大文字にして、区切りなしでつなぐとパスカルケースになる。
- 任意の変換は、オプションとして分けておくと呼び出し側が選べる。
- 同じ変換が頻繁に起きるなら、結果を覚えておくと速くなる。
