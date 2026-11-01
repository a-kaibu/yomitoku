---
title: 読み手の先頭を、ブロックの連なりに沿って進める
description: tokio の mpsc の内部リスト。要素はブロックに詰められて連結されている。読み手の先頭ブロックを、目的の添字のブロックまで、次のブロックへのリンクを辿って進める。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio/src/sync/mpsc/list.rs
lines: [369, 394]
function: Rx::try_advancing_head
difficulty: 3
format: 2
tags: [並行処理, データ構造, 状態機械]
---

## ひとことで

`try_advancing_head` は、tokio の `mpsc` チャネルの **受信側の先頭（head）** を、目的の位置が入っている **ブロック** まで進める関数です。チャネルの要素は、固定の大きさのブロックに詰められ、そのブロックが次のブロックへのリンクでつながっています。

この関数は、先頭のブロックから次のブロックへ、順番に辿っていきます。目的のブロックに着けば `true` を返し、まだ次のブロックが作られていなければ `false` を返します。

## コード

```rust:line-numbers=369
    fn try_advancing_head(&mut self) -> bool {
        let block_index = block::start_index(self.index);

        loop {
            let next_block = {
                let block = unsafe { self.head.as_ref() };

                if block.is_at_index(block_index) {
                    return true;
                }

                block.load_next(Acquire)
            };

            let next_block = match next_block {
                Some(next_block) => next_block,
                None => {
                    return false;
                }
            };

            self.head = next_block;

            thread::yield_now();
        }
    }
```

`self.index` は、読み手が今いる要素の添字です。`block::start_index` で、その添字が属するブロックの開始位置を求めます。この値と、先頭ブロックの位置が一致するまで、ループを続けます。

## 前提知識

- **ブロック付きのリスト**: 要素を複数まとめた箱（ブロック）を、リンクでつないだ連結リストです。1 つずつ要素を連結するより、メモリの確保が少なくて済みます。
- **添字と `start_index`**: 要素の番号から、マスクで下位のビットを落として、そのブロックの先頭の番号を求めます。
- **`Acquire` の読み込み**: 別のスレッドが書いたリンクを、正しく見えるようにするための読み込みの順序の指定です。
- **`Option`**: 次のブロックがあれば `Some`、まだ作られていなければ `None` です。
- **`thread::yield_now`**: 現在のスレッドが、ほかのスレッドに CPU を譲ります。

## 何をしているか

### 1. 目的のブロックの開始位置を求める

```rust:line-numbers=370
        let block_index = block::start_index(self.index);
```

読み手の添字から、そこが属するブロックの開始位置を求めます。これが、先頭を進める目標です。

### 2. 先頭が目標なら終わる

```rust:line-numbers=372
        loop {
            let next_block = {
                let block = unsafe { self.head.as_ref() };

                if block.is_at_index(block_index) {
                    return true;
                }

                block.load_next(Acquire)
            };
```

先頭ブロックが目標の位置と一致したら、`true` を返します。そうでなければ、先頭ブロックの次へのリンクを、`Acquire` の順序で読みます。

### 3. 次がなければ、まだ届いていない

```rust:line-numbers=383
            let next_block = match next_block {
                Some(next_block) => next_block,
                None => {
                    return false;
                }
            };
```

次のブロックが `None` なら、送信側がまだそのブロックを作っていません。このときは、先頭を動かさずに `false` を返します。

### 4. 次へ進んで、譲る

```rust:line-numbers=390
            self.head = next_block;

            thread::yield_now();
```

次のブロックが見つかったら、先頭をそこへ移します。その後、`yield_now` で CPU を譲ってから、ループを続けます。

## ここがすごい

- **ブロック単位で進む**: 1 要素ずつ進まず、ブロックの単位で前進します。目標に近づくまでの移動が、短い回数で済みます。
- **待つ必要がない**: 次のブロックがまだなければ、ブロックせずに `false` を返します。呼び出し側は、別の仕事をしてから再び試せます。
- **譲りで競合を和らげる**: ループの中で CPU を譲るので、送信側や他の受信側の処理が進みやすくなります。

## まとめ

- 読み手の先頭は、ブロックのリンクを辿って目的のブロックまで進める。
- 次のブロックがまだなければ、動かさずに `false` を返す。
- ブロック単位で進み、途中では CPU を譲って競合を和らげる。
