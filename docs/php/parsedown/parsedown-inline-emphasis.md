---
title: "*強調* と **太字** を、記号の数で見分けてHTMLにする"
description: "Parsedown の inlineEmphasis は、Markdown の *斜体* と **太字** を見分けます。記号が 2 つ続くかを先に確かめ、正規表現で囲まれた中身を取り出します。"
language: php
project: Parsedown
repo: https://github.com/erusev/parsedown
license: MIT
copyright: Copyright (c) 2013-2018 Emanuil Rusev, erusev.com
commit: "4e433a8d57078645b55d21fd12c887d3ba6ca01e"
file: Parsedown.php
lines: [1307, 1340]
function: Parsedown::inlineEmphasis
difficulty: 2
format: 2
tags: [パース, 正規表現, 再帰]
---

## ひとことで

`inlineEmphasis` は、Markdown の **強調**（`*文字*` や `**文字**`）を見つけて、HTML の `<em>` や `<strong>` に変える関数です。記号が 1 つなら斜体、2 つなら太字、という規則を、先頭の文字だけで判断します。

## コード

```php:line-numbers=1307
    protected function inlineEmphasis($Excerpt)
    {
        if ( ! isset($Excerpt['text'][1]))
        {
            return;
        }

        $marker = $Excerpt['text'][0];

        if ($Excerpt['text'][1] === $marker and preg_match($this->StrongRegex[$marker], $Excerpt['text'], $matches))
        {
            $emphasis = 'strong';
        }
        elseif (preg_match($this->EmRegex[$marker], $Excerpt['text'], $matches))
        {
            $emphasis = 'em';
        }
        else
        {
            return;
        }

        return array(
            'extent' => strlen($matches[0]),
            'element' => array(
                'name' => $emphasis,
                'handler' => array(
                    'function' => 'lineElements',
                    'argument' => $matches[1],
                    'destination' => 'elements',
                )
            ),
        );
    }
```

## 前提知識

- **Markdown**: 記号で見出しや強調を書ける、軽い書き方の文書形式です。Parsedown は Markdown を HTML に変えるライブラリです。
- **インライン要素**: 文の中に含まれる要素（強調、リンク、コードなど）のことです。段落の中で処理されます。
- **`extent`**: 解析したときに、何文字ぶん読んだかを表す値です。読んだ分だけ先に進めるために使います。
- **`$Excerpt`**: 解析中の残りの文字列を、配列で持っているものです。`text` に残りの本文が入っています。
- **`isset`**: 配列の要素がある（`null` でない）かを調べる関数です。

## 何をしているか

### 1. 記号が 1 つしかなければ、何もしない

```php:line-numbers=1309
        if ( ! isset($Excerpt['text'][1]))
        {
            return;
        }
```

強調の記号は、少なくとも 2 文字必要です。`$Excerpt['text'][1]` がなければ、解析はせずに終わります。

### 2. 先頭の記号を見て、太字か斜体かを試す

```php:line-numbers=1314
        $marker = $Excerpt['text'][0];

        if ($Excerpt['text'][1] === $marker and preg_match($this->StrongRegex[$marker], $Excerpt['text'], $matches))
        {
            $emphasis = 'strong';
        }
        elseif (preg_match($this->EmRegex[$marker], $Excerpt['text'], $matches))
        {
            $emphasis = 'em';
        }
        else
        {
            return;
        }
```

`$marker` は先頭の文字（`*` や `_`）です。2 文字目も同じ記号なら、太字の正規表現を試します。違えば、斜体の正規表現を試します。どちらにも当たらなければ、`return` で何もしません。

### 3. 読んだ長さと、中身の処理を返す

```php:line-numbers=1329
        return array(
            'extent' => strlen($matches[0]),
            'element' => array(
                'name' => $emphasis,
                'handler' => array(
                    'function' => 'lineElements',
                    'argument' => $matches[1],
                    'destination' => 'elements',
                )
            ),
        );
```

返す配列の `extent` は、一致した全体の長さです。`element` の `name` が `strong` か `em` になり、中身（`$matches[1]`）は `lineElements` で改めて解析されます。`destination` は、結果を `elements` に入れる、という指定です。

具体例として `**重要**です` は、先頭の 2 文字が `**` なので太字として扱われ、中身の `重要` が `<strong>` に入ります。

## ここがすごい

### 太字を先に試すことで、取り違えを防ぐ

`**` を `*` 1 つが 2 回続いたものと見ると、斜体と区別がつかなくなります。この関数は、2 文字目も同じ記号かを先に確かめ、太字の規則を優先しています。順番を守るだけで、ほとんどの場合は正しく分けられます。

### 中身を、もう一度解析させる

強調の中には、別の強調やリンクが入ることがあります。`handler` に `lineElements` を指定すると、中身を同じ仕組みで再び解析します。こうして、入れ子の書き方にも対応できます。関数が自分のルールを再利用する、再帰的な設計です。

### 読んだ長さを返すだけ、という分担

この関数は、HTML を作るのではなく、「何文字読んで、どんな要素か」を返すだけです。読み進める処理は外側が担当します。役割が分かれているので、新しい記法を足すときも同じ形で書けます。

## まとめ

- 同じ記号が続くときは、長い形（太字）を先に試すと取り違えを防げる。
- 中身をもう一度解析させると、入れ子の書き方に対応できる。
- 読んだ長さと要素の内容だけを返す設計にすると、新しい記法を足しやすい。
- 短すぎる入力は、最初に抜けると余計な照合を避けられる。
