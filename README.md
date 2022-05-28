# KleeBuild build tool

This tool is awesome, because you don't have to create a single file by yourself.
Just go ahead and initialize a project in an empty directory and start coding.  
Currently this version automatically creates a `compile_commands.json` for use with CLion.
I'm planning on expanding the `kleebuild.yml` configuration file so you can decide which IDE to use.
Please be patient that this currently only supports Linux systems and all features target the use of JetBrains CLion IDE.
I would definitely love some help on this project to improve code readability and make it available on Windows.
  
## initialize a C project with

```bash
kleebuild init
```

## build it with

```bash
kleebuild build
```

## clean up the build directory with

```bash
kleebuild clean
```

## run the executable with

```bash
kleebuild run
```

This will automatically set the priority to 20 (lowest priority on linux)
