---
title: 重複を消しながら、許すプロトコルだけを残す
description: Guzzle の Utils::normalizeProtocols は、http と https だけを受け付け、重複を取り除いて順番を保ちます。配列の鍵の性質を使い、検査と重複の除去を 1 つのループで行います。
language: php
project: Guzzle
repo: https://github.com/guzzle/guzzle
license: MIT
copyright: Copyright (c) 2011 Michael Dowling, Copyright (c) 2012 Jeremy Lindblom
commit: "7d9b1f430bb65ac664e120af227bf9a795ad6333"
file: src/Utils.php
lines: [275, 296]
function: Utils::normalizeProtocols
difficulty: 2
format: 2
tags: [防御的プログラミング, データ構造, API設計]
---
## ひとことで

`normalizeProtocols` は、許可するプロトコルの一覧（`http` と `https` だけ）を受け取り、正しい値だけを、重複のない形に整えて返す関数です。Guzzle の設定で、通信に使ってよいプロトコルを指定するときに使われます。

## コード

```php:line-numbers=275
    public static function normalizeProtocols($protocols): array
    {
        if (!\is_array($protocols) || $protocols === []) {
            throw new InvalidArgumentException('protocols must be a non-empty array of "http" and/or "https"');
        }

        $normalized = [];

        foreach ($protocols as $protocol) {
            if (!\is_string($protocol)) {
                throw new InvalidArgumentException('protocols must contain only strings');
            }

            if ($protocol !== 'http' && $protocol !== 'https') {
                throw new InvalidArgumentException('protocols may only contain "http" and "https"');
            }

            $normalized[$protocol] = true;
        }

        return \array_keys($normalized);
    }
```

## 前提知識

- **配列の鍵の重複**: 同じ鍵に値を入れると、後の代入が前の値を上書きします。つまり、同じ鍵は 1 つしか残りません。
- **`$protocols === []`**: 値が空の配列であるかを、型まで含めて調べる書き方です。
- **`InvalidArgumentException`**: 引数の値が不正なときに投げる例外のクラスです。
- **`array_keys`**: 配列の鍵だけを新しい配列にします。ここでは、重複が消えた鍵の一覧が、そのまま結果になります。
- **`!`（否定）**: 「でない」を表します。`!\is_array(...)` は、配列でないときに真になります。

## 何をしているか

### 1. 配列であり、空でないことを確かめる

```php:line-numbers=277
        if (!\is_array($protocols) || $protocols === []) {
            throw new InvalidArgumentException('protocols must be a non-empty array of "http" and/or "https"');
        }
```

配列でないか、空の配列なら、例外を投げます。プロトコルが 1 つも無いと、通信の設定が意味を持たないためです。

### 2. 1 つずつ検査する

```php:line-numbers=283
        foreach ($protocols as $protocol) {
            if (!\is_string($protocol)) {
                throw new InvalidArgumentException('protocols must contain only strings');
            }

            if ($protocol !== 'http' && $protocol !== 'https') {
                throw new InvalidArgumentException('protocols may only contain "http" and "https"');
            }
```

各要素について、文字列であることと、`http` か `https` のどちらかであることを確かめます。どちらかを外れたら、そのまま例外になります。

### 3. 鍵に入れて重複を消す

```php:line-numbers=292
            $normalized[$protocol] = true;
        }

        return \array_keys($normalized);
```

検査を通ったプロトコルを、連想配列の鍵にします。同じ名前が 2 回来ても、鍵は 1 つだけになります。最後に `array_keys` で鍵の一覧を取り出します。

たとえば `['https', 'http', 'https']` を渡すと、結果は `['https', 'http']` になります。最初に現れた順番が保たれます。

## ここがすごい

- **重複の除去を鍵の性質に任せる**: 重複を探すループを別に書かず、連想配列の鍵の仕組みを使っています。短く、確実な書き方です。
- **順番が保たれる**: 連想配列は、鍵を入れた順番を覚えています。最初に現れた順のまま、重複だけが消えます。
- **検査を先に通す**: 不正な値は、鍵に入れる前に例外で止めます。想定外の値が設定に残ることがありません。
- **エラーの文言が具体的**: どの条件に違反したかが、メッセージから分かります。設定を直す人にとって親切です。

## まとめ

- 重複を消すには、連想配列の鍵に入れて `array_keys` で取り出すと簡潔に書ける。
- 連想配列は挿入の順番を保つので、重複だけが消えて順番が残る。
- 検査は鍵に入れる前に行うと、不正な値が結果に混ざらない。
- 例外のメッセージを具体的に書くと、設定の誤りを見つけやすい。
