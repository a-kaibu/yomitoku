---
title: "複数スレッドから安全に値を追加する、コピーして差し替える方式"
description: "Newtonsoft.Json の ThreadSafeStore.AddValue。読み取りはロックなしで行い、追加のときだけロックを取って辞書を複製し、新しい辞書を差し替える。二重チェックで、同時の追加も 1 回にまとめる。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/ThreadSafeStore.cs
lines: [76, 106]
function: "ThreadSafeStore<TKey, TValue>.AddValue(TKey)"
difficulty: 3
format: 2
tags: [並行処理, ロック不要, 防御的プログラミング]
---

## ひとことで

`ThreadSafeStore.Get(key)` は、キーに対応する値を返し、無ければ作って保存します。
複数のスレッドから同時に呼ばれても壊れないように、**読み取りはロックを使わず**、**追加のときだけ** ロックを取ります。

この部分（`AddValue`）は、その追加を行う処理です。なお、この記事で見るのは `ConcurrentDictionary` が使えない環境向けの版です。

## コード

::: code-group

```csharp:line-numbers=76 [日本語訳]
        private TValue AddValue(TKey key)
        {
            TValue value = _creator(key);

            lock (_lock)
            {
                if (_store == null)
                {
                    _store = new Dictionary<TKey, TValue>();
                    _store[key] = value;
                }
                else
                {
                    // 二重チェック: ロックを取った後で、別のスレッドが先に追加していないか確かめる。
                    if (_store.TryGetValue(key, out TValue checkValue))
                    {
                        return checkValue;
                    }

                    Dictionary<TKey, TValue> newStore = new Dictionary<TKey, TValue>(_store);
                    newStore[key] = value;

#if HAVE_MEMORY_BARRIER
                    Thread.MemoryBarrier();
#endif
                    _store = newStore;
                }

                return value;
            }
        }
```

```csharp:line-numbers=76 [原文]
        private TValue AddValue(TKey key)
        {
            TValue value = _creator(key);

            lock (_lock)
            {
                if (_store == null)
                {
                    _store = new Dictionary<TKey, TValue>();
                    _store[key] = value;
                }
                else
                {
                    // double check locking
                    if (_store.TryGetValue(key, out TValue checkValue))
                    {
                        return checkValue;
                    }

                    Dictionary<TKey, TValue> newStore = new Dictionary<TKey, TValue>(_store);
                    newStore[key] = value;

#if HAVE_MEMORY_BARRIER
                    Thread.MemoryBarrier();
#endif
                    _store = newStore;
                }

                return value;
            }
        }
```

:::

## 前提知識

- **スレッド**: プログラムの中で、同時に進む処理の流れです。複数のスレッドが同じ辞書を触ると、壊れることがあります。
- **ロック（`lock`）**: 1 つのスレッドだけが中に入れるようにする仕組みです。他のスレッドは、終わるまで待ちます。
- **二重チェック（double check）**: ロックの前に 1 回確かめ、ロックの中でもう一度確かめる方法です。待っている間に、別のスレッドが追加していないかを確認します。
- **コピーして差し替える**: 変更するときは、古い辞書を複製して新しい辞書に値を入れ、参照を入れ替えます。古い辞書は読んでいる人がそのまま使えます。
- **`Thread.MemoryBarrier`**: 書き込みの順序を、他のスレッドから見ても正しく保つための命令です。

## 何をしているか

### 1. 値を作る

```csharp:line-numbers=78
            TValue value = _creator(key);
```

キーから値を作ります。ロックの外で作るので、長い処理でも他のスレッドを止めません。

### 2. ロックを取り、二重チェック

```csharp:line-numbers=80
            lock (_lock)
            {
                if (_store == null)
                {
                    _store = new Dictionary<TKey, TValue>();
                    _store[key] = value;
                }
                else
                {
                    // 二重チェック: ロックを取った後で、別のスレッドが先に追加していないか確かめる。
                    if (_store.TryGetValue(key, out TValue checkValue))
                    {
```

ロックを取ったら、もう一度 `_store` を調べます。別のスレッドがすでに追加していたら、その値を返します。

### 3. 複製して差し替える

```csharp:line-numbers=95
                    Dictionary<TKey, TValue> newStore = new Dictionary<TKey, TValue>(_store);
                    newStore[key] = value;

#if HAVE_MEMORY_BARRIER
                    Thread.MemoryBarrier();
#endif
                    _store = newStore;
```

`_store` を複製し、新しいキーと値を入れてから、`_store` の参照を新しい辞書に入れ替えます。読んでいるスレッドは、古い辞書か新しい辞書のどちらか一方を見ることになり、壊れた途中の状態は見えません。

## ここがすごい

- **読み取りがロック不要**: 多くの処理は読み取りなので、待ち時間がほとんどありません。
- **二重チェックで無駄を減らす**: 同時に同じキーを追加しても、値は 1 つにまとめられます。
- **途中の状態を見せない**: 辞書の内容を書き換える代わりに、複製を作って一度に差し替えます。
- **メモリの順序を守る**: `MemoryBarrier` で、差し替えの前に書き込みが済んでいることを保証します。

## まとめ

- `AddValue` は、ロックを取り、二重チェックをしてから、辞書を複製して差し替える。
- 読み取りは速く、追加のときだけ待つ、という設計になっている。
- 辞書の書き換え途中の状態を、他のスレッドが見ないようにしている。
