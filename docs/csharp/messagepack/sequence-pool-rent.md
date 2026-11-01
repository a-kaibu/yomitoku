---
title: "使い終わったバッファを捨てずに、次の処理へ貸し出す"
description: "MessagePack-CSharp の SequencePool。バイト列のバッファ（Sequence）を、借りる（Rent）と返す（Return）の仕組みで使い回し、作り直しによるメモリの無駄を減らす。"
language: csharp
project: "MessagePack for C#"
repo: https://github.com/MessagePack-CSharp/MessagePack-CSharp
license: MIT
copyright: "Copyright (c) 2017 Yoshifumi Kawai and contributors"
commit: "9bc353141d0a280b6a470f1db29d3e0790cbb8b4"
file: src/MessagePack/SequencePool.cs
lines: [107, 151]
function: "SequencePool.Rent() / SequencePool.Return(Sequence<byte>)"
difficulty: 3
format: 2
tags: [メモリ管理, 並行処理, 最適化]
---

## ひとことで

`SequencePool` は、バイト列を入れる **バッファ（Sequence）を使い回す** ためのプールです。
処理が終わったバッファを捨てずに保管しておき、次に必要になったら、そこから借りて使います。

バッファを毎回作り直すと、メモリを大量に確保して、GC の負担も増えます。この仕組みは、その無駄を減らすために作られています。

## コード

::: code-group

```csharp:line-numbers=107 [日本語訳]
        internal Rental Rent()
        {
            lock (this.pool)
            {
                if (this.pool.Count > 0)
                {
                    return new Rental(this, this.pool.Pop());
                }
            }

            var sequence = this.arrayPoolOrMemoryPool is ArrayPool<byte> arrayPool
                ? new Sequence<byte>(arrayPool)
                : new Sequence<byte>((MemoryPool<byte>)this.arrayPoolOrMemoryPool);

            sequence.MinimumSpanLength = MinimumSpanLength;

            // 新しく作ったオブジェクトは、他のインスタンスと同じ配列プールを共有させる。
            // そうしないと、インスタンスごとに独自のプールを持ち、メモリを無駄にする。
            return new Rental(this, sequence);
        }

        private void Return(Sequence<byte> value)
        {
            value.Reset();
            lock (this.pool)
            {
                if (this.pool.Count < this.maxSize)
                {
                    // 借りた側が設定を変えていることがあるので、既定の設定に戻す。
                    value.MinimumSpanLength = MinimumSpanLength;

                    this.pool.Push(value);
                }
            }
        }

        internal struct Rental : IDisposable
        {
            private readonly SequencePool owner;

            internal Rental(SequencePool owner, Sequence<byte> value)
            {
                this.owner = owner;
                this.Value = value;
            }
```

```csharp:line-numbers=107 [原文]
        internal Rental Rent()
        {
            lock (this.pool)
            {
                if (this.pool.Count > 0)
                {
                    return new Rental(this, this.pool.Pop());
                }
            }

            var sequence = this.arrayPoolOrMemoryPool is ArrayPool<byte> arrayPool
                ? new Sequence<byte>(arrayPool)
                : new Sequence<byte>((MemoryPool<byte>)this.arrayPoolOrMemoryPool);

            sequence.MinimumSpanLength = MinimumSpanLength;

            // Configure the newly created object to share a common array pool with the other instances,
            // otherwise each one will have its own ArrayPool or MemoryPool which would likely waste a lot of memory.
            return new Rental(this, sequence);
        }

        private void Return(Sequence<byte> value)
        {
            value.Reset();
            lock (this.pool)
            {
                if (this.pool.Count < this.maxSize)
                {
                    // Reset to preferred settings in case the renter changed them.
                    value.MinimumSpanLength = MinimumSpanLength;

                    this.pool.Push(value);
                }
            }
        }

        internal struct Rental : IDisposable
        {
            private readonly SequencePool owner;

            internal Rental(SequencePool owner, Sequence<byte> value)
            {
                this.owner = owner;
                this.Value = value;
            }
```

:::

## 前提知識

- **プール（pool）**: 使い終わったものを捨てずに保管しておき、必要なときに取り出して再利用する仕組みです。
- **`Sequence<byte>`**: バイト列を、複数の小さな領域に分けて持つ入れ物です。データが大きくても、連続した大きな領域を確保せずに済みます。
- **`lock`**: 1 つのスレッドだけが、中の処理を実行できるようにする仕組みです。プールは複数のスレッドから使われるため、ロックで守っています。
- **`Stack`（後入れ先出し）**: 最後に入れたものを、最初に取り出す入れ物です。`Push` と `Pop` で使います。
- **`IDisposable`**: 使い終わったときに後片付けをするための決まりです。`Rental` は、`Dispose` で自動的に返す仕組みになっています。

## 何をしているか

### 1. 借りる: プールにあれば取り出す

```csharp:line-numbers=109
            lock (this.pool)
            {
                if (this.pool.Count > 0)
                {
                    return new Rental(this, this.pool.Pop());
                }
            }
```

ロックを取ってからプールを確かめ、残っていれば `Pop` して、それを包んだ `Rental` を返します。

### 2. 無ければ新しく作る

```csharp:line-numbers=117
            var sequence = this.arrayPoolOrMemoryPool is ArrayPool<byte> arrayPool
                ? new Sequence<byte>(arrayPool)
                : new Sequence<byte>((MemoryPool<byte>)this.arrayPoolOrMemoryPool);

            sequence.MinimumSpanLength = MinimumSpanLength;

            // 新しく作ったオブジェクトは、他のインスタンスと同じ配列プールを共有させる。
            // そうしないと、インスタンスごとに独自のプールを持ち、メモリを無駄にする。
            return new Rental(this, sequence);
```

プールが空なら、新しい `Sequence` を作ります。配列プールを共有させ、最小の区切りの大きさを設定します。

### 3. 返す: 上限まで保管する

```csharp:line-numbers=128
        private void Return(Sequence<byte> value)
        {
            value.Reset();
            lock (this.pool)
            {
                if (this.pool.Count < this.maxSize)
                {
                    // 借りた側が設定を変えていることがあるので、既定の設定に戻す。
                    value.MinimumSpanLength = MinimumSpanLength;

                    this.pool.Push(value);
                }
            }
```

使い終わったバッファを初期状態に戻し、プールの数が上限より少なければ、設定を既定に直してから `Push` で保管します。上限を超えていれば、そのまま捨てます。

### 4. 借りた値を、使い終わったら返す

```csharp:line-numbers=143
        internal struct Rental : IDisposable
        {
            private readonly SequencePool owner;

            internal Rental(SequencePool owner, Sequence<byte> value)
            {
                this.owner = owner;
                this.Value = value;
```

`Rental` は、中のバッファと、戻し先のプールを持ちます。`Dispose` が呼ばれると、バッファをプールへ返します。

## ここがすごい

- **作り直しを減らす**: 同じバッファを何度も使うので、大きなメモリの確保と解放が減ります。
- **上限を設ける**: 保管する数に上限があるので、一時的に大量に使われても、メモリを抱え続けません。
- **借りた側の設定を戻す**: 返されたバッファは、次の人が使える状態に整えられます。
- **`Dispose` で返し忘れを防ぐ**: `using` と組み合わせれば、借りた後に返し忘れることがありません。

## まとめ

- `SequencePool` は、使い終わったバッファを保管し、必要なときに借りて再利用する。
- プールの取り出しと保管はロックで守り、保管数は上限で抑える。
- 返す前にバッファを初期状態へ戻すので、次の利用者が安全に使える。
