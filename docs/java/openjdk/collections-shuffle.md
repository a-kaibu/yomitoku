---
title: "後ろから 1 つずつ確定させる、公平なシャッフル"
description: "リストをランダムに並べ替える Collections.shuffle。フィッシャー・イェーツ法で全ての並びを同じ確率で作り、リンクリストでは一度配列にしてから混ぜる。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1997, 2025, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/Collections.java
lines: [483, 506]
function: "Collections.shuffle(List, RandomGenerator)"
difficulty: 2
tags: [乱数, アルゴリズム, データ構造]
---

## ひとことで

`Collections.shuffle(list, rnd)` は、リストの要素を **ランダムな順番に並べ替えます**。トランプを切るのと同じです。

使われているのは **フィッシャー・イェーツのシャッフル** という方法で、すべての並び方がちょうど同じ確率で出ます。さらに、番号でのアクセスが遅いリストでは、いったん配列にコピーしてから混ぜる工夫もしています。

## コード

```java:line-numbers=483
    @SuppressWarnings({"rawtypes", "unchecked"})
    public static void shuffle(List<?> list, RandomGenerator rnd) {
        int size = list.size();
        if (size < SHUFFLE_THRESHOLD || list instanceof RandomAccess) {
            for (int i=size; i>1; i--)
                swap(list, i-1, rnd.nextInt(i));
        } else {
            Object[] arr = list.toArray();

            // Shuffle array
            for (int i=size; i>1; i--)
                swap(arr, i-1, rnd.nextInt(i));

            // Dump array back into list
            // instead of using a raw type here, it's possible to capture
            // the wildcard but it will require a call to a supplementary
            // private method
            ListIterator it = list.listIterator();
            for (Object e : arr) {
                it.next();
                it.set(e);
            }
        }
    }
```

## 前提知識

- **`List<?>`**: 要素の型を問わないリストです。
- **`RandomGenerator`**: 乱数を作るもののインタフェースです。`rnd.nextInt(i)` は 0 以上 `i` 未満の整数を同じ確率で返します。
- **`RandomAccess`**: 「番号で速くアクセスできる」ことを示す目印のインタフェースです。`ArrayList` は持っていますが、`LinkedList`（要素を鎖のようにつないだリスト）は持っていません。`instanceof` でそれを調べています。
- **`swap(list, i, j)`**: 2 つの位置の要素を入れ替える関数です。
- **`ListIterator`**: リストを先頭から順にたどりながら、要素を書き換えられる道具です。`it.next()` で次へ進み、`it.set(e)` でその位置を書き換えます。
- **`@SuppressWarnings`**: コンパイラの警告を抑えます。ここでは型を省略した `ListIterator` を使うためです。

## 何をしているか

### 1. フィッシャー・イェーツ法（487〜488 行目）

`[A, B, C, D]` で追います。`i` は 4 から 2 まで減っていきます。

- `i = 4`: 0〜3 から 1 つ選び（例: 1 = `B`）、最後の位置 3 と入れ替え → `[A, D, C, B]`。位置 3 が確定。
- `i = 3`: 0〜2 から選び（例: 0 = `A`）、位置 2 と入れ替え → `[C, D, A, B]`。
- `i = 2`: 0〜1 から選び（例: 1）、位置 1 と入れ替え（同じ位置なので変化なし）。

「まだ確定していない中から 1 つを選び、後ろに置く」を繰り返しています。帽子の中からくじを 1 枚ずつ引いて、引いた順に右から並べるのと同じです。

選び方は `4 × 3 × 2 = 24` 通りで、4 つの要素の並べ方 `4! = 24` とちょうど一致し、1 対 1 に対応します。だから **どの並びも 1/24 で出ます**。

### 2. 遅いリストの場合（489〜505 行目）

`LinkedList` で `swap` を使うと、毎回先頭から位置まで歩くので、とても遅くなります。そこで、

1. `list.toArray()` で配列にコピー
2. 配列の上で同じシャッフル
3. `ListIterator` で先頭から順に歩きながら、配列の内容を書き戻す

とします。書き戻しは 1 回たどるだけで済みます。要素数が `SHUFFLE_THRESHOLD`（5）未満の小さいリストは、歩く距離が短いので直接シャッフルします。

## ここがすごい

- **よくある間違いを避けている**: 「各位置を、全体から選んだ位置と入れ替える」（`nextInt(size)` を毎回使う）という書き方は一見正しそうですが、選び方が `n^n` 通りになり、`n!` で割り切れないため、並びに偏りが出ます。`nextInt(i)` と範囲を狭めていくのが正しいフィッシャー・イェーツ法です。
- **1 回たどるだけ**: 交換は `n - 1` 回、追加のメモリもありません（配列版を除く）。
- **データ構造に合わせた使い分け**: `RandomAccess` という目印で、速い方法を選んでいます。配列にコピーするのはメモリを使いますが、リンクリスト上で交換を繰り返すよりずっと速いという判断です。
- **コメントで設計判断を説明**: 型を省略した書き方を選んだ理由（補助のメソッドを増やさないため）がコメントに残されています。

## まとめ

- フィッシャー・イェーツ法は「未確定の中から 1 つ選んで後ろに置く」を繰り返す、偏りのないシャッフル。
- 乱数の範囲を `nextInt(i)` と狭めていくことが、公平さの鍵。
- 番号アクセスが遅いデータ構造では、一度配列にしてから処理すると速い。
