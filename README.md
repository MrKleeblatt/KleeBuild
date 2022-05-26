# KleeBuild build tool

This tool is awesome, because you don't have to create a single file by yourself.
Just go ahead and initialize a project in an empty directory and start coding.  
Currently this version automatically creates a `compile_commands.json` for use with JetBrains IDE.
I'm planning on expanding the `kleebuild.yml` configuration file so you can decide which IDE to use.
  
initialize a C project with

```bash
kleebuild init
```

build it with

```bash
kleebuild build
```

clean up the build directory with

```bash
kleebuild clean
```
