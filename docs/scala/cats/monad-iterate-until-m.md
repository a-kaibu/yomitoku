---
title: "条件を満たすまで、効果つきの変換を繰り返す"
description: "Cats の Monad.iterateUntilM。初期値に効果つきの変換 f を当て続け、結果が述語 p を満たすまで続ける。iterateWhileM の条件を反転させただけの形。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Monad.scala"
lines: [132, 133]
format: 2
function: "Monad.iterateUntilM"
difficulty: 2
tags: [関数型, 状態機械, イディオム]
---

## ひとことで

Cats の `Monad` にある `iterateUntilM` は、初期の値に効果つきの変換を繰り返し当てます。結果が、指定した条件を満たしたところで止まり、その値を返します。「条件を満たすまで」を書くための道具です。

## コード

```scala:line-numbers=132
  def iterateUntilM[A](init: A)(f: A => F[A])(p: A => Boolean): F[A] =
    iterateWhileM(init)(f)(!p(_))
```

## 前提知識

- `Monad[F]` は、効果つきの計算を順番につなげられる型の約束です。`flatMap` を持ちます。
- `f: A => F[A]` は、値を受け取って、効果つきで新しい値を返す関数です。
- `p: A => Boolean` は、値が条件を満たすかを答える述語です。
- `iterateWhileM` は、条件が真のあいだ繰り返す操作です。`iterateUntilM` は、それを使って作られています。
- `!p(_)` は、`p` の答えを反転させた関数です。`p` が偽のとき真になります。

## 何をしているか

### 1. 「条件を満たすまで」を「条件が偽のあいだ」に言い換える

`iterateUntilM` は、述語 `p` を否定した `!p(_)` を `iterateWhileM` に渡します。「`p` を満たさないあいだ続ける」は、「`p` を満たすまで続ける」と同じ意味です。

```scala:line-numbers=133
    iterateWhileM(init)(f)(!p(_))
```

## ここがすごい

- 新しい繰り返しの仕組みを書かず、既存の `iterateWhileM` に条件を反転して渡すだけです。
- 「条件を満たすまで」という自然な言い方を、型の上で素直に表せます。
- 効果つきの変換なので、途中で失敗が出れば、そこで全体が止まります。
- `iterateWhileM` と並べると、条件の真偽を入れ替えただけの関係が見えて、読み手が理解しやすくなります。

## まとめ

- `iterateUntilM` は、結果が条件を満たすまで、効果つきの変換を繰り返します。
- 中身は、条件を反転して `iterateWhileM` に渡す一行です。
- 条件の真偽を入れ替えることで、既存の繰り返しを再利用しています。
