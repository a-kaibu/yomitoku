---
title: "キューの末尾に要素を入れ、いっぱいなら容量を広げる"
description: ".NET の Queue<T>.Enqueue。円形の配列の末尾に要素を書き、末尾の位置を 1 つ進める。配列がいっぱいのときだけ、先に容量を広げる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/Queue.cs
lines: [167, 178]
function: "Queue<T>.Enqueue(T)"
difficulty: 2
format: 2
tags: [データ構造, 最適化, メモリ管理]
---

## ひとことで

`Enqueue(item)` は、キューの **末尾に要素を追加する** 関数です。
キューは、先に入れた要素から先に取り出されます。つまり、ここで追加した要素は、いちばん後に取り出されることになります。

内部の配列は円のようにつなげて使っているので、末尾が配列の端に来たら、先頭へ戻して書き込みます。

## コード

```csharp:line-numbers=167
        public void Enqueue(T item)
        {
            if (_size == _array.Length)
            {
                Grow(_size + 1);
            }

            _array[_tail] = item;
            MoveNext(ref _tail);
            _size++;
            _version++;
        }
```

## 前提知識

- **キュー（Queue）**: 先に入れた要素から先に取り出す、行列のような仕組みです。
- **円形の配列（リングバッファ）**: 配列の末尾の次が先頭になるように、位置を循環させて使う仕組みです。
- **`_tail`**: 次に要素を書き込む位置です。
- **`_size`**: キューの中にある要素の数です。
- **`MoveNext(ref _tail)`**: 位置を 1 つ進め、配列の末尾を超えたら先頭に戻す補助の関数です。
- **容量の拡張**: 配列がいっぱいになったら、より大きな配列を作ってコピーする処理です。

## 何をしているか

### 1. いっぱいなら容量を広げる

```csharp:line-numbers=169
            if (_size == _array.Length)
            {
                Grow(_size + 1);
```

要素数が配列の長さと同じなら、`Grow` で容量を広げます。空きがなければ、新しい要素は入りません。

### 2. 末尾に書いて、位置を進める

```csharp:line-numbers=174
            _array[_tail] = item;
            MoveNext(ref _tail);
```

末尾の位置 `_tail` に要素を書き込み、位置を 1 つ進めます。末尾が配列の端なら、`MoveNext` が先頭に戻します。

### 3. 個数と版番号を更新する

```csharp:line-numbers=176
            _size++;
            _version++;
```

要素数を 1 増やし、変更の回数（`_version`）も増やします。列挙の途中で変わったことを検出するためです。

## ここがすごい

- **速い追加**: 空きがあれば、配列の末尾に 1 つ書くだけで済みます。配列全体を動かさないので、処理は一定の時間で終わります。
- **配列を使い回す**: 先頭から取り出した後の空きを、次の追加で再利用できます。
- **必要なときだけ広げる**: 容量の拡張は、いっぱいになったときだけ行います。
- **変更を記録する**: 版番号を増やすことで、列挙の途中の変更を検出できます。

## まとめ

- `Enqueue` は、円形の配列の末尾に要素を書き、位置を 1 つ進める。
- 配列がいっぱいのときだけ、先に容量を広げる。
- 要素数と版番号を更新し、列挙の安全性を保つ。
