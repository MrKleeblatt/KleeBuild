function notExisting(filename: string): boolean {
	try {
		Deno.statSync(filename);
		return false;
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) return true;
		else throw error;
	}
}
let Config: { [key: string]: { executable_name: string, compiler: string, ccflags: string[] } }
if ((Deno.args[0] == "init" || Deno.args[0] == "build" || Deno.args[0] == "run")) {
	if (notExisting("./kleebuild.json")) {
		Deno.writeTextFileSync("./kleebuild.json", JSON.stringify({
			default: {
				executable_name: "Main",
				compiler: "gcc",
				ccflags: ["-Wall"]
			}
		}))
	}
	Config = JSON.parse(Deno.readTextFileSync("./kleebuild.json"))
}
switch (Deno.args[0]) {
	case "init":
		if (Deno.args[1]) {
			Deno.mkdirSync(Deno.args[1])
			Deno.chdir(Deno.args[1])
		}
		init()
		break;
	case "build":
		build()
		break;
	case "clean":
		clean()
		break;
	case "run":
		run()
		break;
	default:
		console.log(`This build tool is made by MrKleeblatt. Copyright 2022. Usage:

		init <NAME?>
		 |----> (optionally creates a new directory with NAME and chdir into it) initiates a new project
		build <TARGET>
		 |----> builds an executable in "build" directory
		clean
		 |----> cleans up the build directory
		run <TARGET>
		 |----> runs the executable with lowest priority on linux (DO NOT USE ON WINDOWS)
		`)
		break;
}

function init() {
	console.log("creating default project structure")

	if (notExisting("src")) Deno.mkdirSync("src")
	if (notExisting("src/include")) Deno.mkdirSync("src/include")
	if (notExisting("src/main.c")) Deno.writeTextFileSync("src/main.c",
		`#include <stdio.h>
int main(int argc, char** argv){
	printf("Hello World");
}`)

	prompt("Please open CLion now and open this directory with the 'open' button. Press [Enter] when done! ")

	if (notExisting(".idea")) Deno.mkdirSync(".idea")
	if (notExisting(".idea/customTargets.xml")) Deno.writeTextFileSync(".idea/customTargets.xml",
		`<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
    <component name="CLionExternalBuildManager">
        <target name="kleebuild" defaultType="TOOL">
            <configuration name="kleebuild">
                <build type="TOOL">
                    <tool actionId="Tool_External Tools_build"/>
                </build>
                <clean type="TOOL">
                    <tool actionId="Tool_External Tools_clean"/>
                </clean>
            </configuration>
        </target>
    </component>
</project>`)
	if (notExisting(".idea/runConfigurations")) Deno.mkdirSync(".idea/runConfigurations")
	let count = 0
	for (const file of Deno.readDirSync(".idea/runConfigurations")) if (file.isFile && file.name.endsWith(".xml")) { ++count; break }
	if (count == 0)
		Deno.writeTextFileSync(`.idea/runConfigurations/${Config["default"].executable_name}.xml`,
			`<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="${Config["default"].executable_name}" type="CLionExternalRunConfiguration" factoryName="Application" REDIRECT_INPUT="false" ELEVATE="false" USE_EXTERNAL_CONSOLE="false" WORKING_DIR="file://$PROJECT_DIR$" PASS_PARENT_ENVS_2="true" PROJECT_NAME="${Deno.cwd().split("/").at(-1)}" TARGET_NAME="kleebuild" CONFIG_NAME="kleebuild" RUN_PATH="$PROJECT_DIR$/build/${Config["default"].executable_name}">
    <method v="2">
      <option name="CLION.EXTERNAL.BUILD" enabled="true" />
    </method>
  </configuration>
</component>`)
	if (notExisting(".idea/tools")) Deno.mkdirSync(".idea/tools")
	if (notExisting(".idea/tools/External Tools.xml")) Deno.writeTextFileSync(".idea/tools/External Tools.xml",
		`<toolSet name="External Tools">
	<tool name="build" description="builds the project in &quot;build&quot; directory" showInMainMenu="false" showInEditor="false" showInProject="false" showInSearchPopup="false" disabled="false" useConsole="true" showConsoleOnStdOut="false" showConsoleOnStdErr="false" synchronizeAfterRun="true">
		<exec>
			<option name="COMMAND" value="kleebuild" />
			<option name="PARAMETERS" value="build" />
			<option name="WORKING_DIRECTORY" value="$ProjectFileDir$" />
		</exec>
	</tool>
	<tool name="clean" description="cleans up your project" showInMainMenu="false" showInEditor="false" showInProject="false" showInSearchPopup="false" disabled="false" useConsole="true" showConsoleOnStdOut="false" showConsoleOnStdErr="false" synchronizeAfterRun="true">
		<exec>
			<option name="COMMAND" value="kleebuild" />
			<option name="PARAMETERS" value="clean" />
			<option name="WORKING_DIRECTORY" value="$ProjectFileDir$" />
		</exec>
	</tool>
</toolSet>`)
	if (notExisting("compile_commands.json")) Deno.writeTextFileSync("compile_commands.json", JSON.stringify([{
		directory: Deno.cwd(),
		command: Config["default"].compiler,
		file: "src/main.c"
	}]))

	prompt("Now open the newly created 'compile_commands.json' and click on 'Load Compilation Database Project'. Press [Enter] to continue! ")
	prompt("Almost done! The last thing for you to do is to right click on 'src' directory in CLion and click on 'Mark Directory as' and 'Project Sources and Headers'. Press [Enter] to complete! ")
}

async function build() {
	let files: string[];
	let readAllNamesRecursively: (path: string) => string[];

	if (notExisting("build")) Deno.mkdirSync("build")
	readAllNamesRecursively = (path: string) => {
		const result: string[] = []
		for (const file of Deno.readDirSync(path)) {
			if (file.isDirectory) for (const f of readAllNamesRecursively(path + "/" + file.name)) result.push(file.name + "/" + f)
			else result.push(file.name)
		}
		return result
	}
	files = readAllNamesRecursively("src")
	for (const file of files) if (file.endsWith(".c")) {
		const process = Deno.run({
			cmd: [
				Config[Deno.args[1] || "default"].compiler,
				"-c",
				`src/${file}`,
				"-o",
				`build/${file.replace(".c", ".o").replaceAll(/.+\//g, "")}`,
				...Config[Deno.args[1] || "default"].ccflags,
			],
			stdout: "piped"
		})
		await process.status()
	}
	const options: string[] = [
		Config[Deno.args[1] || "default"].compiler,
		"-o",
		"build/" + Config[Deno.args[1] || "default"].executable_name || "default"
	]
	readAllNamesRecursively = (path: string): string[] => {
		const result: string[] = []
		for (const file of Deno.readDirSync(path)) {
			if (file.isDirectory) for (const f of readAllNamesRecursively(path + "/" + file.name)) result.push(file.name + "/" + f)
			else if (file.name.endsWith(".o")) result.push(file.name)
		}
		return result
	}
	files = readAllNamesRecursively("build")
	for (const file of files) options.push("build/" + file)
	options.push(...Config[Deno.args[1] || "default"].ccflags)
	console.log(options)
	const process = Deno.run({
		cmd: options,
		stdout: "piped"
	})
	await process.status()
}

function clean() {
	Deno.removeSync("build", { recursive: true })
	Deno.mkdirSync("build")
}

function run() {
	Deno.run({
		cmd: ["nice", "-n", "20", `${Deno.cwd()}/build/${Config[Deno.args[1] || "default"].executable_name}`],
		stdout: "piped"
	})
}