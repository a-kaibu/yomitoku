---
title: "よく通る道だけを小さく残す List.Add の「ホット／コールド分割」"
description: "List<T>.Add は、配列に空きがある普通のケースだけを数行に収めてインライン化し、配列を広げるまれなケースは別関数に追い出す。速いコードを書くための定番の形。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/List.cs
lines: [191, 221]
function: "List<T>.Add"
difficulty: 2
format: 2
tags: [最適化, データ構造, イディオム]
---

## ひとことで

`List<T>.Add(item)` は、リストの末尾に要素を 1 つ追加します。`List<T>` は内部に配列を持っていて、空きがあればそこに書き込み、いっぱいなら配列を大きく作り直してから書き込みます。

この 2 つの場合を **別々の関数に分けている** のがポイントです。毎回通る「空きがある」道だけを小さく保ち、呼び出し元に埋め込めるようにしています。

## コード

::: code-group

```csharp:line-numbers=191 [日本語訳]
        // リストの末尾に与えられたオブジェクトを追加する。リストのサイズは 1 増える。
        // 必要なら、追加する前に容量を 2 倍にする。
        // 新しい要素を追加する前に。
        //
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public void Add(T item)
        {
            _version++;
            T[] array = _items;
            int size = _size;
            if ((uint)size < (uint)array.Length)
            {
                _size = size + 1;
                array[size] = item;
            }
            else
            {
                AddWithResize(item);
            }
        }

        // List.Add からのインライン展開を避ける。めったに通らない経路なので、コード品質を上げるため。
        [MethodImpl(MethodImplOptions.NoInlining)]
        private void AddWithResize(T item)
        {
            Debug.Assert(_size == _items.Length);
            int size = _size;
            Grow(size + 1);
            _size = size + 1;
            _items[size] = item;
        }
```

```csharp:line-numbers=191 [原文]
        // Adds the given object to the end of this list. The size of the list is
        // increased by one. If required, the capacity of the list is doubled
        // before adding the new element.
        //
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public void Add(T item)
        {
            _version++;
            T[] array = _items;
            int size = _size;
            if ((uint)size < (uint)array.Length)
            {
                _size = size + 1;
                array[size] = item;
            }
            else
            {
                AddWithResize(item);
            }
        }

        // Non-inline from List.Add to improve its code quality as uncommon path
        [MethodImpl(MethodImplOptions.NoInlining)]
        private void AddWithResize(T item)
        {
            Debug.Assert(_size == _items.Length);
            int size = _size;
            Grow(size + 1);
            _size = size + 1;
            _items[size] = item;
        }
```

:::

## 前提知識

- **`List<T>`**: 長さを変えられる配列です。内部に `_items`（実際の配列）と `_size`（使っている要素数）を持ちます。配列の長さ（容量）は要素数以上で、余った部分が空きです。
- **フィールドとローカル変数**: `_items` や `_size` のように `_` で始まるのは、このクラスのフィールド（オブジェクトが持つ変数）です。この関数ではそれをローカル変数 `array`、`size` に一度コピーしています。
- **`[MethodImpl(MethodImplOptions.AggressiveInlining)]` / `NoInlining`**: 前者は「呼び出し元に展開してほしい」、後者は「展開しないで」という JIT への指示です。
- **`(uint)size < (uint)array.Length`**: 両方を符号なしにして比べています。後述の通り、範囲チェックを消すための書き方です。
- **`_version`**: リストが変更された回数です。`foreach` の途中でリストが変更されたことを検出するために使います。

## 何をしているか

### 1. 空きがあればすぐ書き込む

```csharp:line-numbers=198
            _version++;
            T[] array = _items;
            int size = _size;
            if ((uint)size < (uint)array.Length)
            {
                _size = size + 1;
                array[size] = item;
            }
```

容量 4 のリストに要素が 2 個入っているなら、`size = 2 < 4` なので `array[2] = item` と書き、`_size` を 3 にして終わりです。ほとんどの `Add` はここで終わります。

### 2. いっぱいなら別の関数へ

```csharp:line-numbers=206
            else
            {
                AddWithResize(item);
            }
```

`size == array.Length` なら `AddWithResize` を呼びます。そちらで `Grow` を呼んで配列を（通常は 2 倍に）作り直し、要素を書き込みます。

## ここがすごい

- **ホットパスとコールドパスの分割**: よく通る道（ホット）は数行で、めったに通らない道（コールド）は別関数です。コメントの通り、`AddWithResize` を `NoInlining` にすることで、`Add` 本体のマシン語が小さくなり、`AggressiveInlining` で呼び出し元に展開しやすくなります。展開されれば関数呼び出しのコストがゼロになります。
- **範囲チェックの除去**: C# の配列アクセス `array[size]` には、通常「範囲内か」の確認が入ります。でも直前に `(uint)size < (uint)array.Length` と確かめているので、JIT は「この添字は必ず範囲内」とわかり、確認を省きます。`uint` にしているのは、負の数も含めて 1 回の比較で範囲内を保証するためです。
- **フィールドをローカルにコピー**: `_items` や `_size` を何度も読むと、そのたびにメモリから読み直す必要があるかもしれません。ローカル変数にすればレジスタに置けますし、「チェックした配列と書き込む配列が同じ」ことも JIT にとって明らかになります（範囲チェックの除去に必要です）。
- **2 倍ずつ広げる**: 配列を 2 倍ずつ大きくするので、n 個追加したときのコピーの総量は n に比例する程度で済みます。1 回あたりにならすと定数時間です（償却定数時間）。

## まとめ

- よく通る短い道と、まれに通る重い道は、関数を分けるとよい。
- 「`(uint)i < (uint)array.Length` で確かめてからアクセス」で、JIT は範囲チェックを消せる。
- フィールドはローカル変数にコピーしてから使うと、最適化されやすい。
