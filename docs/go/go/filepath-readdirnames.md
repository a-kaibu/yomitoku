---
title: "ディレクトリの中の名前を並べて返す filepath.readDirNames"
description: "path/filepath の readDirNames。ディレクトリを開いて、中のファイル名をすべて読み、名前の順に並べて返す。読み終えたら必ずファイルを閉じ、読み取りのエラーは呼び出し側へ返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/path/filepath/path.go"
lines: [447, 459]
function: "readDirNames"
difficulty: 2
tags: [ファイル, 入出力, 標準ライブラリ]
---

## ひとことで

`filepath.Walk` や `filepath.WalkDir` は、ディレクトリを下へたどっていきます。そのとき、各ディレクトリの中身の名前を取り出すのが `readDirNames` です。名前は、読んだ順番ではなく、**辞書順に並べて** 返します。

同じディレクトリを、毎回同じ順番でたどれるようにするための関数です。

## コード

```go:line-numbers=447
func readDirNames(dirname string) ([]string, error) {
	f, err := os.Open(dirname)
	if err != nil {
		return nil, err
	}
	names, err := f.Readdirnames(-1)
	f.Close()
	if err != nil {
		return nil, err
	}
	slices.Sort(names)
	return names, nil
}
```

## 前提知識

- **ディレクトリ**: ファイルやサブディレクトリの名前を並べた、特別なファイルです。`os.Open` で開くと、中身を読めます。
- **`Readdirnames(-1)`**: ディレクトリの中の名前をすべて、スライスで読む `os.File` のメソッドです。`-1` は「全部」という意味です。
- **`f.Close()`**: 開いたファイルを閉じて、資源を返す操作です。忘れると、開いたままになります。
- **`slices.Sort`**: スライスを、要素の大小の順に並べ替える関数です。文字列なら辞書順になります。

## 何をしているか

### 1. ディレクトリを開いて失敗を確かめる

```go:line-numbers=448
	f, err := os.Open(dirname)
	if err != nil {
		return nil, err
	}
```

ディレクトリを開きます。開けなければ、エラーをそのまま返します。

### 2. 名前を全部読んで、すぐに閉じる

```go:line-numbers=452
	names, err := f.Readdirnames(-1)
	f.Close()
	if err != nil {
		return nil, err
	}
```

中の名前を全部読みます。読み終えたら、エラーの有無にかかわらず、すぐに `f.Close()` で閉じます。閉じてから、読み取りのエラーを確かめて返します。閉じる処理を先に置くことで、エラーのときもファイルが閉じられます。

### 3. 名前の順に並べる

```go:line-numbers=457
	slices.Sort(names)
	return names, nil
```

読んだ名前を辞書順に並べ替えて返します。ディレクトリの読み方によって、順番が変わってしまうことを防ぎます。

## ここがすごい

- **閉じる処理を忘れない**: 読んだあとすぐに閉じるので、エラーがあっても、開いたままのファイルが残りません。
- **順番を固定する**: ファイルシステムが返す順番は、環境で違うことがあります。並べ替えを入れることで、どの環境でも同じ順番でたどれます。
- **エラーを隠さない**: 閉じる前に読めたかを、閉じたあとで確かめて、読み取りのエラーを必ず返します。

## まとめ

- `readDirNames` は、ディレクトリの中の名前を全部読んで返します。
- 読んだら、エラーの有無にかかわらず、すぐに閉じます。
- 名前は辞書順に並べてから返します。
- ディレクトリをたどる処理が、毎回同じ順番で動くようになります。
