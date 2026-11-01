---
title: "「% で一周」より「比較して 0 に戻す」が速いリングバッファ"
description: "Queue<T> の MoveNext は、配列の末尾まで来たら先頭に戻る添字の進め方。剰余演算子を使わず、めったに成り立たない if で 0 に戻すほうが速いとコメントで明言している。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/Queue.cs
lines: [333, 345]
function: "Queue<T>.MoveNext"
difficulty: 1
tags: [データ構造, 最適化, イディオム]
---

## ひとことで

`Queue<T>`（先に入れたものから先に出すキュー）は、配列を **輪のように** 使います（リングバッファ）。先頭の位置 `_head` と末尾の位置 `_tail` を進めていき、配列の終わりまで来たら 0 に戻ります。

`MoveNext` は、その「1 つ進める、終わりなら 0 に戻す」を担う小さな関数です。教科書的には `index = (index + 1) % length` と書くところを、あえて if で書いています。

## コード

```csharp:line-numbers=333
        // Increments the index wrapping it if necessary.
        private void MoveNext(ref int index)
        {
            // It is tempting to use the remainder operator here but it is actually much slower
            // than a simple comparison and a rarely taken branch.
            // JIT produces better code than with ternary operator ?:
            int tmp = index + 1;
            if (tmp == _array.Length)
            {
                tmp = 0;
            }
            index = tmp;
        }
```

## 前提知識

- **リングバッファ**: 長さ 4 の配列で、添字が 0 → 1 → 2 → 3 → 0 → 1 … と一周するように使う方法です。要素を取り出しても配列の中身をずらさずに済むので、キューに向いています。
- **`ref int index`**: 引数を「参照で」受け取ります。関数の中で `index = tmp` と書くと、呼び出し元の変数（`_head` や `_tail`）が直接書き換わります。`MoveNext(ref _head)` のように呼びます。
- **`%`（剰余演算子）**: 割り算の余りです。`(3 + 1) % 4` は 0 です。
- **三項演算子 `?:`**: `条件 ? a : b` で、条件が真なら a、偽なら b になります。

## 何をしているか

長さ 4 の配列で `index = 2` なら、`tmp = 3`、3 は 4 と違うのでそのまま `index = 3` になります。
`index = 3` なら、`tmp = 4`、4 は配列の長さと等しいので `tmp = 0`、`index = 0` になります。

`Dequeue`（取り出し）では `MoveNext(ref _head)`、`Enqueue`（追加）では `MoveNext(ref _tail)` として使われます。

## ここがすごい

- **剰余は遅い**: 336〜337 行目のコメントにある通り、`%` は内部で割り算命令を使います。割り算は足し算や比較に比べて何倍も遅い命令です。配列の長さは実行時まで決まらないので、コンパイラが掛け算に置き換えることもできません。
- **めったに成り立たない分岐は安い**: `tmp == _array.Length` が真になるのは、配列を一周するときだけです。長さ 1000 のキューなら 1000 回に 1 回です。CPU の分岐予測は「ほぼいつも偽」というパターンをすぐに覚えるので、この if はほとんどコストがかかりません。
- **三項演算子より if**: 338 行目のコメントによると、`tmp = tmp == len ? 0 : tmp` と書くよりも、この形のほうが JIT がよいマシン語を出すそうです。「同じ意味でもコンパイラの出力が違う」ことを計測で確かめた結果が、コメントに残っています。
- **一時変数 `tmp`**: `index` は参照なので、直接 `index++` すると、メモリ上の `_head` を何度も読み書きすることになりかねません。ローカル変数で計算してから最後に 1 回だけ書いています。

## まとめ

- リングバッファの添字は「1 足して、長さと同じなら 0」で一周できる。
- 剰余演算は割り算なので遅い。めったに成り立たない if のほうが速いことが多い。
- 「速い書き方」はコンパイラや CPU によって変わる。理由をコメントに残すと、後の人が元に戻してしまうのを防げる。
