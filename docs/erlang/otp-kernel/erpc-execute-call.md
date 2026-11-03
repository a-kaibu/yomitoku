---
title: "遠くで実行した結果を、例外の種類ごとに 1 つのメッセージへ包む"
description: "erpc:execute_call/4 は、遠くのノードで関数を実行し、正常の戻り値と throw・exit・error のどれかを、1 つのタプルに包んで exit で返す。呼び出し側はその形を見て結果を判断する。"
language: erlang
project: "Erlang/OTP kernel"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2020-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/kernel/src/erpc.erl
lines: [1260, 1277]
function: "erpc:execute_call/4"
difficulty: 3
format: 2
tags: ["並行処理", "エラー処理", "ネットワーク"]
---
## ひとことで

`erpc:execute_call/4` は、`erpc` の実行を担当する内部の関数です。指定された関数 `M:F(A)` を実行し、その結果を 1 つの値にまとめて、プロセスの終了理由として返します。
正常に終わった場合も、例外が起きた場合も、呼び出し側が同じ形で受け取れるように、結果の形を決めています。

## コード

```erlang:line-numbers=1260
execute_call(Ref, M, F, A) ->
    Reply = try
                {Ref, return, apply(M, F, A)}
            catch
                throw:Reason ->
                    {Ref, throw, Reason};
                exit:Reason ->
                    {Ref, exit, Reason};
                error:Reason:Stack ->
                    case is_arg_error(Reason, M, F, A) of
                        true ->
                            {Ref, error, {?MODULE, Reason}};
                        false ->
                            ErpcStack = trim_stack(Stack, M, F, A),
                            {Ref, error, Reason, ErpcStack}
                    end
            end,
    exit(Reply).
```

## 前提知識

- **`erpc`**: 別のノードで関数を実行し、結果を待つための仕組みです。`rpc` の後継として作られました。
- **`apply(M, F, A)`**: モジュール `M` の関数 `F` を、引数のリスト `A` で呼び出します。
- **例外の 3 つの種類**: `throw`（投げられた値）、`exit`（プロセスの終了）、`error`（実行時のエラー）です。`try ... catch` では、この 3 つを区別できます。
- **`error:Reason:Stack`**: `error` の例外を、理由とスタックトレースの両方を付けて捕まえます。
- **`exit/1`**: 現在のプロセスを、理由付きで終わらせます。この理由を、呼び出し側は受け取れます。

## 何をしているか

### 1. 正常に終わったとき

```erlang:line-numbers=1261
    Reply = try
                {Ref, return, apply(M, F, A)}
```

`apply/3` が正常に終わると、`{Ref, return, 戻り値}` という形にまとめます。`Ref` は、呼び出しを区別する目印です。

### 2. throw で終わったとき

```erlang:line-numbers=1263
            catch
                throw:Reason ->
                    {Ref, throw, Reason};
```

`throw` で投げられた値は、そのまま `{Ref, throw, Reason}` にします。

### 3. exit で終わったとき

```erlang:line-numbers=1266
                exit:Reason ->
                    {Ref, exit, Reason};
```

`exit` で終わったときは、理由を `{Ref, exit, Reason}` に入れます。

### 4. error で終わったとき

```erlang:line-numbers=1268
                error:Reason:Stack ->
                    case is_arg_error(Reason, M, F, A) of
                        true ->
                            {Ref, error, {?MODULE, Reason}};
                        false ->
                            ErpcStack = trim_stack(Stack, M, F, A),
                            {Ref, error, Reason, ErpcStack}
                    end
```

`error` の場合は、引数が正しくないことが原因かを `is_arg_error/4` で判定します。引数の誤りなら、`erpc` のエラーとして `{?MODULE, Reason}` を返します。それ以外は、スタックトレースを `trim_stack/4` で整えて、理由と一緒に返します。

### 5. 結果を終了理由として送る

```erlang:line-numbers=1276
            end,
    exit(Reply).
```

まとめた結果を `exit(Reply)` で投げます。プロセスが終わると、リンクや監視をしている相手に、この値が理由として届きます。呼び出し側は、その値の形を見て結果を判断します。

## ここがすごい

### 結果の形を統一して、受け取り側を単純にする

正常な値、`throw`、`exit`、`error` を、すべて `{Ref, 種類, 値}` の形にそろえています。受け取る側は、先頭の種類だけを見れば分岐できます。
遠くのノードでの例外を、どの種類でも取りこぼさないための設計です。

### 終了理由で結果を運ぶ

普通の戻り値は、プロセスの終わり方と関係ありません。この関数は、`exit` の理由という通信路を使って、結果を運びます。
プロセスの監視の仕組みで、結果が確実に届く、という特徴を使っています。

## まとめ

- 関数の結果は、正常と例外のすべてを、同じ形のタプルにまとめると扱いやすくなります。
- `throw`、`exit`、`error` は、それぞれ違う捕まえ方が必要です。
- `exit` の理由を通信路に使うと、結果を監視の仕組みで確実に届けられます。
