---
title: "「3 回ひっくり返す」だけでリストを回転する"
description: "前半を反転、後半を反転、最後に全体を反転するとリストが回転する。番号でのアクセスが遅いリスト向けに使われる、古典的で美しい回転アルゴリズム。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1997, 2025, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/Collections.java
lines: [835, 848]
function: "Collections.rotate2"
difficulty: 2
tags: [アルゴリズム, データ構造, 標準ライブラリ]
---

## ひとことで

`Collections.rotate2` は、リストを回転させるもう 1 つの実装です。やり方は驚くほど単純で、**前半を反転、後半を反転、全体を反転** の 3 回だけです。

`[a, b, c, d, e]` を右に 2 回転して `[d, e, a, b, c]` を作るとき、`[a, b, c | d, e]` を `[c, b, a | e, d]` にし、全体を反転して `[d, e, a, b, c]` です。

## コード

```java:line-numbers=835
    private static void rotate2(List<?> list, int distance) {
        int size = list.size();
        if (size == 0)
            return;
        int mid =  -distance % size;
        if (mid < 0)
            mid += size;
        if (mid == 0)
            return;

        reverse(list.subList(0, mid));
        reverse(list.subList(mid, size));
        reverse(list);
    }
```

## 前提知識

- **`List<?>`**: 要素の型を問わないリストです。`?` は「何かの型」を表すワイルドカードで、このメソッドは要素の中身を見ずに並べ替えるだけなので、型を決める必要がありません。
- **`list.subList(from, to)`**: リストの `from` 番目から `to` 番目の手前までを表す「窓」を返します。コピーではなく **元のリストの一部を指す見え方（ビュー）** なので、`subList` を反転すると元のリストのその部分が反転します。
- **`reverse(list)`**: 同じクラスの `Collections.reverse` で、リストの並びを逆にします。両端から要素を入れ替えていくので、リンクリストでも効率よく動きます。
- **`%` と負の数**: Java の `%` は、左側が負なら結果も負になります。`-2 % 5` は `-2` です。

## 何をしているか

### 1. 切れ目の位置を求める（836〜843 行目）

右に `distance` 回転すると、末尾の `distance` 個が先頭に来ます。つまり **元のリストの `size - distance` 番目が切れ目** です。これを `-distance % size` で求め、負なら `size` を足します。

`size = 5`、`distance = 2` なら、`-2 % 5 = -2`、`+5` して `mid = 3` です。`distance` が負（左回転）でも、同じ式で正しい切れ目が出ます。`mid` が 0 なら回転しても変わらないので何もしません。

### 2. 3 回反転する（845〜847 行目）

```
元        : a b c | d e
前半を反転 : c b a | d e
後半を反転 : c b a | e d
全体を反転 : d e   a b c
```

最後の反転で、前半と後半の位置が入れ替わり、同時に、それぞれの中身の向きが元に戻ります。

### なぜうまくいくのか

並び `X` を反転したものを `X'` と書くと、`(X' Y')'` は `Y X` になります。全体を反転すると「順番が逆になる」と同時に「各部分の中身も逆になる」ので、先に中身だけ逆にしておけば打ち消し合い、**部分の順番だけが入れ替わる** のです。

## ここがすごい

- **どんなリストでも効率よく動く**: 反転は両端から順に入れ替えていく処理なので、番号でのアクセスが遅いリンクリストでも、前と後ろから歩いていけば速く処理できます。そのため `Collections.rotate` は、`LinkedList` のようなリストでこの実装を選びます。
- **追加のメモリがほぼ不要**: 新しいリストを作らず、元の場所で入れ替えるだけです。
- **ビューを活かした簡潔さ**: `subList` がコピーではなくビューなので、`reverse` を部分に使い回せます。回転専用のループを書かずに、既存の部品 3 回で済ませています。
- **左右の回転を 1 つの式で**: `-distance % size` と負の補正で、右回転も左回転も同じ切れ目の計算にまとめています。

この「3 回反転」は、テキストエディタで文字列の 2 つの部分を入れ替えるときなどにも使われる古典的な技法で、プログラミングの名著でもよく紹介されています。

## まとめ

- 2 つの部分を入れ替えるには「それぞれ反転 → 全体を反転」でよい。
- `subList` のようなビューを使うと、部分に対して既存の処理を使い回せる。
- 同じ問題でも、データ構造に合わせてアルゴリズムを使い分ける（`rotate1` と `rotate2`）。
