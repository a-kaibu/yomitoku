---
title: "要素を「玉突き」で 1 回ずつだけ動かすリストの回転"
description: "リストを指定した距離だけ回転させる関数。各要素を最終位置へ直接運ぶ「サイクル」をたどり、余分な配列を使わずに n 回の代入で終える。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1997, 2025, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/Collections.java
lines: [811, 833]
function: "Collections.rotate1"
difficulty: 3
tags: [アルゴリズム, データ構造, 標準ライブラリ]
---

## ひとことで

`Collections.rotate(list, distance)` は、リストの要素を **右へ `distance` だけずらし、はみ出た分を先頭へ回す** メソッドです。`[a, b, c, d, e]` を 2 回転すると `[d, e, a, b, c]` になります。

`rotate1` は、そのうち配列のように番号で速く読み書きできるリストのための実装です。追加の配列を作らず、**それぞれの要素を最終位置へ一発で運ぶ** ので、代入はちょうど要素数と同じ回数で済みます。

## コード

```java:line-numbers=811
    private static <T> void rotate1(List<T> list, int distance) {
        int size = list.size();
        if (size == 0)
            return;
        distance = distance % size;
        if (distance < 0)
            distance += size;
        if (distance == 0)
            return;

        int bound = size - distance;
        for (int cycleStart = 0, nMoved = 0; nMoved < size; cycleStart++) {
            T displaced = list.get(cycleStart);
            int i = cycleStart;
            do {
                if (i >= bound)
                    i -= size;
                i += distance;
                displaced = list.set(i, displaced);
                nMoved++;
            } while (i != cycleStart);
        }
    }
```

## 前提知識

- **`List<T>`**: 順番つきの要素の並びです。`<T>` はジェネリクスといい、「要素の型は何でもよいが、1 つの型にそろえる」ことを表します。
- **`list.get(i)` / `list.set(i, x)`**: `i` 番目を読む、書き換える操作です。`set` は **書き換える前に入っていた値を返します**。この性質がこのコードの鍵です。
- **`%`（余り）**: Java では、負の数の余りは負になります。`-3 % 5` は `-3` です。
- **`for (初期化; 条件; 更新)`**: 繰り返しです。この `for` は変数を 2 つ（`cycleStart` と `nMoved`）宣言しています。
- **`do { … } while (条件);`**: 本体を先に 1 回実行してから条件を調べる繰り返しです。

## 何をしているか

### 1. 距離を正規化する（812〜819 行目）

距離が長さより大きくても意味は同じなので、`distance % size` にします。負の距離（左回転）は `size` を足して右回転に直します。0 なら何もしません。

### 2. 玉突きでたどる（821〜832 行目）

`[a, b, c, d, e]`、`distance = 2` で追います。位置 `i` の要素は位置 `i + 2`（はみ出たら 5 を引く）へ行きます。

- `displaced = a`（0 番の要素を手に持つ）
- `i = 2` へ `a` を置き、もとの `c` を手に持つ → `[a, b, a, d, e]`
- `i = 4` へ `c` を置き、`e` を持つ → `[a, b, a, d, c]`
- `i = 1`（4+2-5）へ `e` を置き、`b` を持つ → `[a, e, a, d, c]`
- `i = 3` へ `b` を置き、`d` を持つ → `[a, e, a, b, c]`
- `i = 0` へ `d` を置く → `[d, e, a, b, c]`。出発点に戻ったので 1 周終わり。

5 回の代入で全員が移動し、`nMoved` が 5 になって終了です。

### 3. 複数の輪がある場合

長さ 6・距離 2 だと、`0 → 2 → 4 → 0` の輪と `1 → 3 → 5 → 1` の輪の 2 つに分かれます。1 つ目の輪が終わっても `nMoved` は 3 なので、`cycleStart` を 1 に進めて 2 つ目の輪をたどります。輪の数は長さと距離の最大公約数になりますが、このコードは最大公約数を計算せず、**動かした数を数えるだけ** で終わりを判定しています。

### 4. はみ出しの処理（826〜828 行目）

`i >= bound`（`bound = size - distance`）のときは、足すと範囲を超えるので先に `size` を引いてから `distance` を足します。こうすると途中で `int` が大きくなりすぎることもなく、`%` も使わずに済みます。

## ここがすごい

- **`set` の戻り値で「玉突き」を 1 行に**: `displaced = list.set(i, displaced)` は「新しい値を置いて、追い出された値を受け取る」を 1 行でやっています。一時変数を使った入れ替えより短く、意図も明確です。
- **余分なメモリを使わない**: 新しいリストにコピーすれば簡単ですが、要素数ぶんのメモリが必要です。この方法は手に持つ 1 つの要素だけで回転できます。
- **最大公約数を計算しない**: 輪の数を数学的に求める代わりに、「全員動いたら終わり」という数え方で判定しています。正しさを保ったまま、コードを単純にしています。
- **リストの種類で使い分け**: `Collections.rotate` は、番号で速くアクセスできるリスト（`ArrayList` など）や小さいリストではこの `rotate1` を、そうでないリスト（`LinkedList` など）では「3 回反転」を使う `rotate2` を選びます。

## まとめ

- 回転は「各要素を最終位置へ運ぶ輪（サイクル）」に分解できる。
- 追い出された値を返す `set` を使うと、玉突きの移動が簡潔に書ける。
- 終了条件を「動かした数」で数えると、輪がいくつあっても同じコードで扱える。
