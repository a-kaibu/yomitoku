---
title: "小さい数の ToString は「作ったら覚えておく」キャッシュで使い回す"
description: "uint を文字列にする UInt32ToDecStr。300 未満の数は、初めて文字列にしたときに配列へ保存し、2 回目からは同じ文字列を返す。メモリ確保を減らす遅延キャッシュの典型。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Number.Formatting.cs
lines: [1977, 1996]
function: "Number.UInt32ToDecStr(uint)"
difficulty: 2
tags: [キャッシュ, 文字列処理, メモリ管理]
---

## ひとことで

`UInt32ToDecStr(value)` は、`uint` を 10 進数の文字列に変える関数で、`int.ToString()` や `uint.ToString()` の中で使われます。

この関数は、**300 未満の小さな数については、一度作った文字列を配列に覚えておき、次からは同じ文字列を返します**。`200.ToString()` を何万回呼んでも、文字列は 1 つしか作られません。

## コード

```csharp:line-numbers=1977
        internal static string UInt32ToDecStr(uint value)
        {
            // For small numbers, consult a lazily-populated cache.
            if (value < SmallNumberCacheLength)
            {
                return UInt32ToDecStrForKnownSmallNumber(value);
            }

            return UInt32ToDecStr_NoSmallNumberCheck(value);
        }

        internal static string UInt32ToDecStrForKnownSmallNumber(uint value)
        {
            Debug.Assert(value < SmallNumberCacheLength);
            return SmallNumberCache.Value[value] ?? CreateAndCacheString(value);

            [MethodImpl(MethodImplOptions.NoInlining)] // keep rare usage out of fast path
            static string CreateAndCacheString(uint value) =>
                SmallNumberCache.Value[value] = UInt32ToDecStr_NoSmallNumberCheck(value);
        }
```

キャッシュの配列と大きさは同じファイルの 258〜277 行目で定義されています（CoreCLR では 300、Mono では 10）。

```csharp
private static class SmallNumberCache
{
    internal static readonly string?[] Value = new string[SmallNumberCacheLength];
}
```

## 前提知識

- **文字列はオブジェクト**: C# の `string` はヒープ（GC が管理するメモリ）に作られるオブジェクトです。たくさん作るとメモリを使い、GC（使われなくなったオブジェクトを片付ける処理）の仕事も増えます。
- **文字列は不変（immutable）**: 一度作った `string` の中身は変更できません。だから同じ文字列を複数の場所で共有しても安全です。
- **`string?`**: `null` になりうる文字列、という型の注釈です。キャッシュの配列は最初すべて `null` です。
- **`??`（null 合体演算子）**: `a ?? b` は、a が null でなければ a、null なら b を評価して返します。
- **静的クラスの中の `static readonly` 配列**: `SmallNumberCache` クラスに初めて触れたときに 1 回だけ作られます（型の初期化）。数値を文字列にしないプログラムでは、配列すら作られません。
- **ローカル関数と `[MethodImpl(MethodImplOptions.NoInlining)]`**: 1994 行目の `CreateAndCacheString` は関数の中の関数です。インライン化を禁止して、めったに通らない処理を本体から追い出しています。

## 何をしているか

### 1. 小さい数ならキャッシュへ（1980〜1983 行目）

`value = 200` なら 300 未満なので、`UInt32ToDecStrForKnownSmallNumber` に進みます。

### 2. 覚えていれば返す、なければ作って覚える（1991 行目）

`SmallNumberCache.Value[200]` を見て、すでに `"200"` があればそれを返します。`null` なら `CreateAndCacheString` で文字列を作り、配列に入れてから返します。

### 3. 大きい数はふつうに作る（1985 行目）

300 以上の数は毎回新しく作ります。

## ここがすごい

- **よく使われる数に絞る**: 260〜265 行目のコメントによると、300 という大きさは HTTP のステータスコード（200 など）や、`byte`（0〜255）の `ToString()` をすべて含められるように選ばれています。全部キャッシュすると約 11.5KB、配列だけなら約 2.4KB と、メモリの見積もりまで書かれています。
- **遅延して作る**: 300 個の文字列を最初に全部作るのではなく、実際に使われた数だけを作ります。使われない数のためにメモリを使いません。
- **スレッドセーフでなくても問題ない**: 2 つのスレッドが同時に同じ数を初めて文字列にすると、両方が文字列を作り、どちらかが配列に残ります。でもどちらも同じ中身の不変な文字列なので、結果は正しいままです。ロックを使わずに済むのは、文字列が不変だからです。
- **珍しい処理を外に出す**: 文字列を作ってキャッシュする処理は、各数につき 1 回しか起きないので `NoInlining` で本体から分けています。本体は「配列を引いて null でなければ返す」だけの小さなコードになります。
- **環境ごとに大きさを変える**: サイズを気にする環境（Mono、モバイルや WebAssembly でよく使われる）では 10 個に抑えています。

## まとめ

- 不変なオブジェクトは、作ったものを覚えておいて使い回せる。
- 「よく使われる小さな範囲」だけをキャッシュすると、少ないメモリで大きな効果が出る。
- 初回だけの重い処理は別関数に分け、いつも通る道を小さく保つ。
