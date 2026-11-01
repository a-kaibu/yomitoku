---
title: "衝突リストを「配列の添字」でつなぎ直す Dictionary のリサイズ"
description: "Dictionary の Resize は、エントリの配列をそのままコピーし、バケットだけを作り直す。連結リストを添字でつなぎ、バケットには 1 始まりの番号を入れて 0 を「空」として使う。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/Dictionary.cs
lines: [1248, 1291]
function: "Dictionary<TKey, TValue>.Resize"
difficulty: 3
tags: [ハッシュ, データ構造, メモリ管理]
---

## ひとことで

`Dictionary<TKey, TValue>` は、キーから値をすばやく引けるハッシュ表です。要素が増えて内部の配列がいっぱいになると、この `Resize` が呼ばれて、より大きな配列に作り直します。

.NET の Dictionary は、**エントリ（キー・値・ハッシュ値・次へのリンク）の配列** と、**バケット（どのエントリから探し始めるか）の配列** の 2 つでできています。Resize では、エントリはそのままコピーし、バケットとリンクだけを新しく張り直します。

## コード

```csharp:line-numbers=1248
        private void Resize(int newSize, bool forceNewHashCodes)
        {
            // Value types never rehash
            Debug.Assert(!forceNewHashCodes || !typeof(TKey).IsValueType);
            Debug.Assert(_entries != null, "_entries should be non-null");
            Debug.Assert(HashHelpers.IsPrime(newSize));
            Debug.Assert(newSize >= _entries.Length);

            Entry[] entries = new Entry[newSize];

            int count = _count;
            Array.Copy(_entries, entries, count);

            if (!typeof(TKey).IsValueType && forceNewHashCodes)
            {
                Debug.Assert(_comparer is NonRandomizedStringEqualityComparer);
                IEqualityComparer<TKey> comparer = _comparer = (IEqualityComparer<TKey>)((NonRandomizedStringEqualityComparer)_comparer).GetRandomizedEqualityComparer();

                for (int i = 0; i < count; i++)
                {
                    if (entries[i].next >= -1)
                    {
                        entries[i].hashCode = (uint)comparer.GetHashCode(entries[i].key);
                    }
                }
            }

            // Assign member variables after both arrays allocated to guard against corruption from OOM if second fails
            _buckets = new int[newSize];
#if TARGET_64BIT
            _fastModMultiplier = HashHelpers.GetFastModMultiplier((uint)newSize);
#endif
            for (int i = 0; i < count; i++)
            {
                if (entries[i].next >= -1)
                {
                    ref int bucket = ref GetBucket(entries[i].hashCode);
                    entries[i].next = bucket - 1; // Value in _buckets is 1-based
                    bucket = i + 1;
                }
            }

            _entries = entries;
        }
```

## 前提知識

- **ハッシュ表とバケット**: キーからハッシュ値（整数）を計算し、それをバケット数で割った余りで「どのバケットに入れるか」を決めます。違うキーが同じバケットになる（衝突する）ことがあるので、同じバケットのエントリはリストでつなぎます。
- **`Entry` 構造体**: このクラスの中で定義されていて、`hashCode`、`next`（同じバケットの次のエントリの添字）、`key`、`value` を持ちます。
- **`ref int bucket = ref GetBucket(...)`**: バケット配列の要素そのものへの参照です。`bucket = i + 1` と書くと配列の中身が書き換わります。
- **`typeof(TKey).IsValueType`**: キーの型が値型（`int` や構造体）かどうか。JIT はこれをジェネリクスの型ごとに定数として扱い、不要な分岐を消します。
- **`#if TARGET_64BIT`**: 64 ビット向けのビルドでだけ有効になるコードです。

## 何をしているか

### 1. エントリをまるごとコピー（1256〜1259 行目）

新しいエントリ配列を作り、古いものを先頭から `count` 個そのままコピーします。キーも値もハッシュ値も **計算し直しません**。

### 2. 必要ならハッシュ値を計算し直す（1261〜1273 行目）

文字列キーで衝突が多すぎる場合に限り、ハッシュ関数をランダム化されたものに切り替え、ハッシュ値を計算し直します（後述）。

### 3. バケットを作り直して、リンクを張り直す（1276〜1288 行目）

新しいバケット配列（すべて 0）を作り、エントリを先頭から 1 つずつ見ていきます。各エントリについて、

1. 新しいバケットを求める（`GetBucket`）
2. 自分の `next` に「今そのバケットにいる先頭」を入れる
3. バケットに自分の番号（`i + 1`）を入れる

つまり、**バケットのリストの先頭に自分を差し込む** 操作です。

バケットに入れる番号が **1 始まり**（`i + 1`）なのがポイントです。新しく作った配列は 0 で埋まっているので、「0 = 空」と読めます。`next = bucket - 1` は、空のバケットなら `-1`（リストの終わり）になります。

`entries[i].next >= -1` は「使用中のエントリ」の判定です。削除されたエントリは `next` に `-3` 以下の値（空きリストの情報）が入っているので、リンクし直しの対象から外れます。

## ここがすごい

- **ノードを作らない連結リスト**: 衝突したエントリのリストを、オブジェクトのポインタではなく **配列の添字** でつないでいます。エントリは 1 つの配列に詰まっているので、メモリが連続していてキャッシュに優しく、GC が追跡するオブジェクトも増えません。
- **1 始まりで初期化を省く**: 0 を「空」として使えば、新しく確保した配列（.NET では必ず 0 で埋まっている）をそのまま使えます。-1 で埋め直すループが要りません。
- **ハッシュ値を保存しておく**: `Entry.hashCode` を持っているので、リサイズのときにキーの `GetHashCode()` を呼び直さずに済みます。文字列のハッシュ計算は文字数に比例するので、大きな効果があります。
- **ハッシュ衝突攻撃への備え**: 1261〜1273 行目は、文字列キーの衝突が多すぎるときに、ランダムな種を使うハッシュ関数に切り替える仕組みです。わざと同じハッシュ値になる文字列を大量に送りつける攻撃（Hash DoS）への対策です。
- **OOM に備えた代入の順番**: 1275 行目のコメントの通り、新しい配列を全部確保できてからフィールドに代入しています。途中でメモリ不足になっても、Dictionary が壊れた状態にならないようにしています。

## まとめ

- 連結リストは、ポインタの代わりに配列の添字でも作れる。メモリが連続して速い。
- 「0 = 空」になるよう番号を 1 ずらすと、配列の初期化を省ける。
- ハッシュ値を保存しておくと、作り直すときに計算し直さなくて済む。
