---
title: "辞書のキーを、ハッシュ値の鎖（チェーン）をたどって探す"
description: ".NET の Dictionary<TKey, TValue>.FindValue。ハッシュ値からバケツを求め、同じバケツに連なるエントリを next でたどって、キーが一致するものを探す。値型のキーでは既定の比較器を直接使う。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/Dictionary.cs
lines: [404, 441]
function: "Dictionary<TKey, TValue>.FindValue(TKey)"
difficulty: 3
format: 2
tags: [ハッシュ, データ構造, 最適化]
---

## ひとことで

`FindValue(key)` は、辞書の中から **キーに対応するエントリ** を探して、その場所への参照を返す関数です。
見つからなければ、参照を「無し」の状態で返します。

辞書は、ハッシュ値からバケツを選び、同じバケツに入ったエントリを **鎖（チェーン）** で繋いで管理しています。この関数は、その鎖をたどって探します。

## コード

::: code-group

```csharp:line-numbers=404 [日本語訳]
            ref Entry entry = ref Unsafe.NullRef<Entry>();
            if (_buckets != null)
            {
                Debug.Assert(_entries != null, "expected entries to be != null");
                IEqualityComparer<TKey>? comparer = _comparer;
                if (typeof(TKey).IsValueType && // comparer can only be null for value types; enable JIT to eliminate entire if block for ref types
                    comparer == null)
                {
                    // TODO: key.GetHashCode に置き換える予定（issue https://github.com/dotnet/runtime/issues/117521 の解決後）。
                    uint hashCode = (uint)EqualityComparer<TKey>.Default.GetHashCode(key);
                    int i = GetBucket(hashCode);
                    Entry[]? entries = _entries;
                    uint collisionCount = 0;

                    // 値型では EqualityComparer<TKey>.Default の組み込みを使い、仮想呼び出しを避ける。
                    i--; // バケツの値は 1 から始まるので、1 引いて添字にする。次の条件と一緒に処理がまとまる。
                    do
                    {
                        // if の中で確かめておくと、次の配列アクセスの範囲チェックを省ける。
                        if ((uint)i >= (uint)entries.Length)
                        {
                            goto ReturnNotFound;
                        }

                        entry = ref entries[i];
                        if (entry.hashCode == hashCode && EqualityComparer<TKey>.Default.Equals(entry.key, key))
                        {
                            goto ReturnFound;
                        }

                        i = entry.next;

                        collisionCount++;
                    } while (collisionCount <= (uint)entries.Length);

                    // 鎖がループしている = 別のスレッドが同時に書き換えた、という意味。
                    // 無限に回り続けないように、ここで抜けて例外を投げる。
                    goto ConcurrentOperation;
```

```csharp:line-numbers=404 [原文]
            ref Entry entry = ref Unsafe.NullRef<Entry>();
            if (_buckets != null)
            {
                Debug.Assert(_entries != null, "expected entries to be != null");
                IEqualityComparer<TKey>? comparer = _comparer;
                if (typeof(TKey).IsValueType && // comparer can only be null for value types; enable JIT to eliminate entire if block for ref types
                    comparer == null)
                {
                    // TODO: Replace with just key.GetHashCode once https://github.com/dotnet/runtime/issues/117521 is resolved.
                    uint hashCode = (uint)EqualityComparer<TKey>.Default.GetHashCode(key);
                    int i = GetBucket(hashCode);
                    Entry[]? entries = _entries;
                    uint collisionCount = 0;

                    // ValueType: Devirtualize with EqualityComparer<TKey>.Default intrinsic
                    i--; // Value in _buckets is 1-based; subtract 1 from i. We do it here so it fuses with the following conditional.
                    do
                    {
                        // Test in if to drop range check for following array access
                        if ((uint)i >= (uint)entries.Length)
                        {
                            goto ReturnNotFound;
                        }

                        entry = ref entries[i];
                        if (entry.hashCode == hashCode && EqualityComparer<TKey>.Default.Equals(entry.key, key))
                        {
                            goto ReturnFound;
                        }

                        i = entry.next;

                        collisionCount++;
                    } while (collisionCount <= (uint)entries.Length);

                    // The chain of entries forms a loop; which means a concurrent update has happened.
                    // Break out of the loop and throw, rather than looping forever.
                    goto ConcurrentOperation;
```

:::

## 前提知識

- **ハッシュ値**: キーから計算した整数です。同じキーには同じハッシュ値が出ます。
- **バケツ**: ハッシュ値から選ばれる入れ物です。`_buckets` という配列の中で、最初のエントリの場所（1 始まり）を持っています。
- **エントリ**: キー、値、ハッシュ値、そして次のエントリの場所（`next`）を持つ入れ物です。`_entries` の配列に並んでいます。
- **チェイン法**: 同じバケツに入ったエントリを、`next` でつないでいく衝突の処理方法です。
- **`ref` の戻り値**: 配列の中のエントリそのものを指す参照です。コピーせずに、値を読んだり書き換えたりできます。

## 何をしているか

### 1. ハッシュ値からバケツを求める

```csharp:line-numbers=413
                    uint hashCode = (uint)EqualityComparer<TKey>.Default.GetHashCode(key);
                    int i = GetBucket(hashCode);
```

値型のキーなら、既定の比較器でハッシュ値を求め、その値からバケツを選びます。

### 2. 鎖をたどって、キーが一致するものを探す

```csharp:line-numbers=415
                    Entry[]? entries = _entries;
                    uint collisionCount = 0;

                    // 値型では EqualityComparer<TKey>.Default の組み込みを使い、仮想呼び出しを避ける。
                    i--; // バケツの値は 1 から始まるので、1 引いて添字にする。次の条件と一緒に処理がまとまる。
```

バケツの値から 1 を引いて添字にします。そこにあるエントリを読み、ハッシュ値とキーが両方一致すれば、見つかったことになります。

```csharp:line-numbers=420
                    do
                    {
                        // if の中で確かめておくと、次の配列アクセスの範囲チェックを省ける。
                        if ((uint)i >= (uint)entries.Length)
                        {
                            goto ReturnNotFound;
                        }

                        entry = ref entries[i];
```

一致しなければ、`next` を辿って次のエントリへ進みます。添字が配列の範囲を出たら、見つからなかったことになります。

### 3. 鎖がループしていないか見る

```csharp:line-numbers=434
                        i = entry.next;

                        collisionCount++;
                    } while (collisionCount <= (uint)entries.Length);
```

`collisionCount` を数えて、配列の長さより多く回ったら、鎖がループしていると判断します。

```csharp:line-numbers=439
                    // 鎖がループしている = 別のスレッドが同時に書き換えた、という意味。
                    // 無限に回り続けないように、ここで抜けて例外を投げる。
                    goto ConcurrentOperation;
```

ループしていれば、別のスレッドが同時に書き換えたと考えられるので、例外を投げます。

## ここがすごい

- **ハッシュ値を先に比べる**: キーの比較は、ハッシュ値が同じエントリだけで行うので、無駄な比較が減ります。
- **参照を返す**: 値をコピーせず、見つかった場所を直接指すので、値の更新も速くできます。
- **型で処理を分ける**: 値型のキーでは、既定の比較器を直接使うので、仮想呼び出しを避けられます。
- **壊れた状態を検出する**: 無限ループに陥らないよう、回数の上限を設けています。

## まとめ

- `FindValue` は、ハッシュ値からバケツを選び、`next` で繋がったエントリを順にたどって探す。
- 一致は、ハッシュ値を先に比べ、そのあとキーを比べる。
- 値への参照を返すので、見つかった場所を直接読み書きできる。
