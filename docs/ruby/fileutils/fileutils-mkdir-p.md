---
title: "途中のフォルダがなくても、一度に深いパスを作る"
description: "FileUtils.mkdir_p は、存在しないフォルダを親から順に洗い出し、末尾から作り直す。深いパスを 1 回の呼び出しで作れる。"
language: ruby
project: "Ruby fileutils (標準ライブラリ)"
repo: https://github.com/ruby/fileutils
license: "BSD-2-Clause OR Ruby"
copyright: "Ruby is copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "445150507c580806e66dc58a066a5dea1e2361ba"
file: lib/fileutils.rb
lines: [395, 418]
function: "FileUtils.mkdir_p"
difficulty: 2
format: 2
tags: ["ファイル", "イディオム", "防御的プログラミング"]
---
## ひとことで

`FileUtils.mkdir_p` は、`a/b/c/d` のようなパスを、途中のフォルダが無くても作れる関数です。
シェルの `mkdir -p` と同じ働きをします。
途中のフォルダが既にあれば、そのまま使い、無いものだけを作ります。

## コード

```ruby:line-numbers=395
  def mkdir_p(list, mode: nil, noop: nil, verbose: nil)
    list = fu_list(list)
    fu_output_message "mkdir -p #{mode ? ('-m %03o ' % mode) : ''}#{list.join ' '}" if verbose
    return *list if noop

    list.each do |item|
      path = remove_trailing_slash(item)

      stack = []
      until File.directory?(path) || File.dirname(path) == path
        stack.push path
        path = File.dirname(path)
      end
      stack.reverse_each do |dir|
        begin
          fu_mkdir dir, mode
        rescue SystemCallError
          raise unless File.directory?(dir)
        end
      end
    end

    return *list
  end
```

## 前提知識

- **`mkdir -p`**: シェルで、途中のフォルダも含めて作るときに使うオプションです。既にあってもエラーになりません。
- **`File.dirname`**: パスから、一つ上のフォルダの部分を取り出す関数です。`a/b/c` なら `a/b` です。
- **スタック（stack）**: 後から入れたものを先に取り出す、後入れ先出しの入れ物です。Ruby では配列の `push` と `pop` で使えます。
- **`reverse_each`**: 配列を後ろから順に回すメソッドです。
- **`SystemCallError`**: OS のシステムコールが失敗したときの例外の親クラスです。

## 何をしているか

### 1. 作るべきフォルダを、下から順に集める

```ruby:line-numbers=403
      stack = []
      until File.directory?(path) || File.dirname(path) == path
        stack.push path
        path = File.dirname(path)
      end
```

まず、今のパスが既にフォルダなら、何も作らずに終わります。
そうでなければ、`stack` に積み、一つ上の親に移ります。親も無ければ、また積みます。
親が存在するか、もうルートに着いたら、ループは止まります。`File.dirname(path) == path` は、ルートで同じ値が返るので、その判定です。

### 2. 親から順に、フォルダを作る

```ruby:line-numbers=408
      stack.reverse_each do |dir|
        begin
          fu_mkdir dir, mode
```

`stack` には、子から親の順で入っています。`reverse_each` で、親から順に取り出して作ります。
親ができてから子を作るので、作成の順番が崩れません。

### 3. 別の処理に先に作られても、エラーにしない

```ruby:line-numbers=411
        rescue SystemCallError
          raise unless File.directory?(dir)
        end
```

確かめてから作るまでの間に、別のプロセスが同じフォルダを作ることがあります。
その場合、`fu_mkdir` は失敗しますが、フォルダは存在しているので、エラーにはせず続けます。
フォルダが無いままの失敗だけを、例外として外へ投げます。

## ここがすごい

### 作るものだけを、短いループで決める

親から一つずつ確かめて作ると、既にあるフォルダのところで止まれます。
`stack` に積む方式は、「どこから作り始めるか」を一度のループで決め、その後は作るだけです。
単純な再帰より、読みやすく、深さの上限も気にしなくてよい形です。

### 競合を、エラーとして扱わない

並行して動くプログラムでは、「確かめる」と「作る」の間に変化が入ります。
この実装は、作る操作が失敗したときに、もう一度フォルダがあるかを確かめています。
結果として、同時に作成しても、どちらかが失敗して終わることはありません。

### 「既にある」を正常な状態として扱う

`mkdir -p` の考え方を、そのまま Ruby の関数にしています。
既にあるのは失敗ではなく、目的が達成された状態です。だから、途中で例外にせず、そのまま進みます。

## まとめ

- `mkdir_p` は、存在しない親を含めて、深いパスを一度に作ります。
- まず作るべきパスを `stack` に集め、親から順に作ります。
- 同時に別の処理が作った場合も、フォルダがあれば失敗とはみなしません。
- 「既にある」を正常とする、`mkdir -p` と同じ考え方で作られています。
