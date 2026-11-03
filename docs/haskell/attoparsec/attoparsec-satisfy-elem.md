---
title: "条件に合う 1 要素を、入力から読み取る"
description: "attoparsec の satisfyElem。現在の位置の要素を取り出して条件を調べ、合えば読み進める。入力が途中で切れていれば、続きを取りに行く。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/Internal.hs
lines: [156, 162]
function: "satisfyElem"
difficulty: 2
format: 2
tags: [パース, 関数型, 防御的プログラミング]
---

## ひとことで

`satisfyElem p` は、入力の今の位置にある 1 要素を取り出し、それが条件 `p` に合うかを調べる関数です。合えばその要素を返して読み進め、合わなければ失敗します。

## コード

```haskell:line-numbers=156
satisfyElem :: forall t . Chunk t
            => (ChunkElem t -> Bool) -> Parser t (ChunkElem t)
satisfyElem p = Parser $ \t pos more lose succ ->
    case bufferElemAt (undefined :: t) pos t of
      Just (e, l) | p e -> succ t (pos + Pos l) more e
                  | otherwise -> lose t pos more [] "satisfyElem"
      Nothing -> satisfySuspended p t pos more lose succ
```

## 前提知識

- **`Chunk t`**: 入力のかたまりを扱う型の制約です。`ByteString` や `Text` が当てはまります。
- **`ChunkElem t`**: そのかたまりの 1 要素の型です。バイト列なら 1 バイト、文字列なら 1 文字を表します。
- **`Maybe`**: 値があれば `Just`、なければ `Nothing` になる型です。
- **`forall t .`**: 型変数 `t` を、関数の中で使えるようにする書き方です。

## 何をしているか

### 1. 今の位置の要素を取り出す

```haskell:line-numbers=159
    case bufferElemAt (undefined :: t) pos t of
```

`bufferElemAt` は、現在の位置にある要素を、その要素の長さ `l` と一緒に取り出します。取り出せなければ `Nothing` になります。

### 2. 条件に合えば読み進める

```haskell:line-numbers=160
      Just (e, l) | p e -> succ t (pos + Pos l) more e
```

条件 `p e` が真なら、読み位置を要素の長さ分だけ進めて、その要素 `e` を結果として返します。

### 3. 合わなければ失敗する

```haskell:line-numbers=161
                  | otherwise -> lose t pos more [] "satisfyElem"
```

条件に合わないときは、位置を動かさずに失敗させます。失敗の理由には `"satisfyElem"` と書きます。

### 4. 入力が足りなければ続きを取りに行く

```haskell:line-numbers=162
      Nothing -> satisfySuspended p t pos more lose succ
```

今のかたまりに要素がなければ、`satisfySuspended` で続きの入力を待ってから、同じ条件で調べ直します。

## ここがすごい

「読めるかどうか」と「条件に合うか」を、ひとつの `case` でまとめて扱っています。失敗したときは位置を変えないので、呼び出し側は安心して別の候補を試せます。

また、入力が分割されて届く場合も、`Nothing` の分岐で続きを取りに行くので、呼び出し側は分割を意識しなくてよくなっています。

## まとめ

- 1 要素の読み取りは、「取り出す」「調べる」「進める」の 3 段階に分けると分かりやすい。
- 失敗のときは位置を動かさないと、やり直しが安全になる。
- 入力の分割を内部で吸収すると、使う側の書き方が簡単になる。
