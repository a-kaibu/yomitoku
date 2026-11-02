---
title: "文字列の比較を、途中で止めない"
description: "Play Framework の Cookie 署名検査にある safeEquals。違う場所が見つかっても最後まで比べ、処理時間から一致の位置がわかってしまう攻撃を防ぐ。"
language: scala
project: "Play Framework"
repo: https://github.com/playframework/playframework
license: "Apache-2.0"
copyright: "Copyright (C) from 2022 The Play Framework Contributors, 2011-2021 Lightbend Inc."
commit: "d6f230d44764606509272c4173a37b89d7f372ce"
file: "core/play/src/main/scala/play/api/mvc/Cookie.scala"
lines: [605, 615]
format: 2
function: "safeEquals"
difficulty: 2
tags: [セキュリティ, 防御的プログラミング]
---

## ひとことで

Play Framework の Cookie 署名の検査で使われる `safeEquals` です。2 つの文字列を比べるとき、違う文字が見つかっても途中で止めず、最後まで全部の文字を比べます。かかる時間から、どこまで一致していたかを推測されないようにするためです。

## コード

```scala:line-numbers=605
    def safeEquals(a: String, b: String) = {
      if (a.length != b.length) {
        false
      } else {
        var equal = 0
        for (i <- Array.range(0, a.length)) {
          equal |= a(i) ^ b(i)
        }
        equal == 0
      }
    }
```

## 前提知識

- 署名付き Cookie は、中身の文字列に秘密の鍵で作った署名（ハッシュのような値）を付けたものです。サーバーは受け取った署名と、自分が計算した署名を比べて、改ざんがないかを確かめます。
- 普通の `==` は、先頭から比べて違いが見つかった時点で `false` を返します。
- `^` は XOR で、同じビットなら 0、違うビットなら 1 を返します。
- `|=` は「右と OR して代入する」演算子です。
- `for (i <- Array.range(0, n))` は、0 から n - 1 までの数を順に取り出して繰り返す書き方です。

## 何をしているか

### 1. 長さが違えば、すぐ false にする

最初の `if` では、長さの違う文字列を即座に `false` にします。長さは攻撃者にもある程度わかる情報なので、ここでは早く返しても問題ないと判断しています。

### 2. 違いを OR で溜めていく

長さが同じなら、`equal` という変数に、文字ごとの XOR の結果を OR で溜めていきます。

```scala:line-numbers=609
        var equal = 0
        for (i <- Array.range(0, a.length)) {
          equal |= a(i) ^ b(i)
        }
        equal == 0
```

1 文字でも違えば、その位置の XOR の結果は 0 でないので、`equal` は 0 でない値になります。一度 0 でない値になると、後の OR で 0 に戻ることはありません。

### 3. 最後に 1 回だけ判定する

すべての文字を比べ終わってから、`equal == 0` で一致かどうかを決めます。途中で `return` しないので、違いがどこにあっても処理時間はほぼ同じになります。

## ここがすごい

- 途中で止める比較は、先頭が一致している文字列ほど時間がかかります。攻撃者は時間の差を測って、署名を 1 文字ずつ当てられてしまいます。このタイミング攻撃を防ぐのが、この関数の目的です。
- 比較の結果を `Boolean` で 1 回ずつ返すのではなく、ビットの OR で 1 つの数に溜めることで、分岐を減らしています。
- コメントに「変えるな」と強い注意があるのは、一見無駄に見える全件比較が、安全性のために必要だからです。
- 長さの確認を先に行うことは、意図的にそのままにしています。長さを隠すと、かえって実装が複雑になるからです。

## まとめ

- 秘密の値を比べるときは、途中で止めない比較を使うと、時間の差から情報が漏れにくくなります。
- 違いを XOR と OR で溜めて、最後に 1 回判定すると、分岐のない比較になります。
- セキュリティに関わるコードは、速さより予測しにくさを優先して書きます。
