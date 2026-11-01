---
title: "配列を作り終えてから、フィールドに代入して壊れた状態を防ぐ"
description: "Dictionary<TKey, TValue> の Initialize。容量を素数に丸め、バケットとエントリの 2 つの配列を作り、両方が確保できた後で初めてフィールドに代入する。メモリ不足で途中まで壊れた状態を残さない書き方。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/Dictionary.cs
lines: [489, 504]
function: "Dictionary<TKey, TValue>.Initialize"
difficulty: 2
format: 2
tags: [メモリ管理, 防御的プログラミング, ハッシュ]
---

## ひとことで

`Initialize(capacity)` は、`Dictionary` が最初にデータを入れるときに、**内部の 2 つの配列（バケットとエントリ）を用意する** 関数です。
容量は、指定された数以上の **素数** に丸められます。

この関数の大事な点は、2 つの配列を作り終えてから、フィールドに代入していることです。途中でメモリが足りなくなっても、中途半端な状態の辞書が残らないようにしています。

## コード

::: code-group

```csharp:line-numbers=489 [日本語訳]
        private int Initialize(int capacity)
        {
            int size = HashHelpers.GetPrime(capacity);
            int[] buckets = new int[size];
            Entry[] entries = new Entry[size];

            // 2 つの配列の確保が終わってからフィールドに代入する。2 つ目の確保が失敗したときの OOM による破損を防ぐため。
            _freeList = -1;
#if TARGET_64BIT
            _fastModMultiplier = HashHelpers.GetFastModMultiplier((uint)size);
#endif
            _buckets = buckets;
            _entries = entries;

            return size;
        }
```

```csharp:line-numbers=489 [原文]
        private int Initialize(int capacity)
        {
            int size = HashHelpers.GetPrime(capacity);
            int[] buckets = new int[size];
            Entry[] entries = new Entry[size];

            // Assign member variables after both arrays allocated to guard against corruption from OOM if second fails
            _freeList = -1;
#if TARGET_64BIT
            _fastModMultiplier = HashHelpers.GetFastModMultiplier((uint)size);
#endif
            _buckets = buckets;
            _entries = entries;

            return size;
        }
```

:::

## 前提知識

- **バケット配列**: ハッシュ値から「どの箱を見るか」を決める `int` の配列です。
- **エントリ配列**: キーと値、次のエントリへの番号などを持つ `Entry` の配列です。
- **`_freeList = -1`**: 削除された場所の空きリストを、空の状態（-1）にします。
- **`HashHelpers.GetPrime(capacity)`**: 容量以上で最小の素数を返します。素数の大きさの配列を使うと、ハッシュの偏りに強くなります。
- **OOM（Out of Memory）**: メモリが足りなくて、新しい配列が作れない状態です。.NET では例外として投げられます。

## 何をしているか

### 1. 素数の大きさの配列を 2 つ作る

```csharp:line-numbers=491
            int size = HashHelpers.GetPrime(capacity);
            int[] buckets = new int[size];
            Entry[] entries = new Entry[size];
```

容量を素数に丸めて、そのサイズの `int` の配列（バケット）と `Entry` の配列（エントリ）を作ります。ここで `new` が失敗すると、例外が投げられます。

### 2. フィールドに代入する

```csharp:line-numbers=495
            // 2 つの配列の確保が終わってからフィールドに代入する。2 つ目の確保が失敗したときの OOM による破損を防ぐため。
            _freeList = -1;
#if TARGET_64BIT
            _fastModMultiplier = HashHelpers.GetFastModMultiplier((uint)size);
#endif
            _buckets = buckets;
            _entries = entries;
```

2 つの配列の作成が終わってから、フィールドを更新します。順番は次のとおりです。

1. 空きリストを空にする（`_freeList = -1`）。
2. 64 ビット環境なら、割り算を避けるための乗数を計算する。
3. バケットとエントリを、フィールドに入れる。

2 つ目の配列の作成が失敗すると、フィールドは一切変わりません。古い状態の辞書が、そのまま使えるのが利点です。

### 3. 容量を返す

```csharp:line-numbers=503
            return size;
```

丸められた容量を呼び出し元に返します。

## ここがすごい

- **失敗しても壊れない**: 配列を先に作り、フィールドは後で変えるという順番です。途中で例外が起きても、辞書の内部は整合性を保ちます。
- **素数の容量**: 2 のべき乗ではなく素数を使うと、ハッシュ値の下位ビットに偏りがあっても、バケットに均等に散らばりやすくなります。
- **64 ビット専用の乗数**: 割り算を掛け算に置き換える乗数を、ここで 1 回だけ計算します。以降の検索で、その恩恵を受けられます。
- **コメントで理由を残す**: このコメントには、なぜこの順番にするかが書かれています。後の人が順番を入れ替えてしまうことを防ぐ目印です。

## まとめ

- 複数の配列を作るときは、全部作り終えてからフィールドを更新すると、失敗時も壊れない。
- ハッシュ表の大きさを素数にすると、偏りに強くなる。
- 順番の理由はコメントに残すと、後の変更で壊れにくい。
