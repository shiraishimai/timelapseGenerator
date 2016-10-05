let fs = require("fs"),
    path = require("path"),
    promise = require('bluebird'),
    spawn = require("child_process").spawn,
    readdirPromise = promise.promisify(fs.readdir),
    exe = (cmd, callback) => {
        console.log("cmd>> ", cmd);
        let arg = Array.isArray(cmd) ? cmd : cmd.split(" "),
            command = arg.shift(),
            subProcess = spawn(command, arg, {
                stdio: "inherit"
            });
        subProcess.on("exit", function(code) {
            // log(cmd+" exit with code:"+JSON.stringify(code));
        });
        subProcess.on("close", function(code) {
            console.log("\x1b[32;3m", cmd + "\nclose with code:" + JSON.stringify(code), "\x1b[0m");
            if (code === 0) {
                return callback();
            }
            callback(code);
        });
        subProcess.on("error", function(code) {
            console.log("\x1b[31m", cmd + "\nerror with code:" + JSON.stringify(code), "\x1b[0m");
            callback(code);
        });
    };

const FPS = 20;

// getDirectoryArray("./").then(dirs => {
//     let promiseArray = [];
//     for (let dir of dirs) {
//         let relativePath = path.resolve("./", dir);
//         promiseArray.push(getDirectoryArray(relativePath, ".JPG", 1).then(file => {
//             let fileIndex = file[0].match(/(\d+).JPG/)[1];
//             return [relativePath, parseInt(fileIndex)];
//         }));
//     }
//     return promise.all(promiseArray);
// }).then(resultArray => {
//     return new promise((resolve, reject) => {
//         let videoIndex = 1,
//             sequentialCall = () => {
//                 if (!resultArray.length) return resolve();
//                 let processItem = resultArray.shift();
//                 console.log("start processing...", processItem);
//                 exe("ffmpeg -r "+FPS+" -f image2 -start_number "+processItem[1]+" -i "+path.resolve(processItem[0], "G00%d.JPG")+" -vcodec libx264 -crf 25 segment"+videoIndex+".mkv", exitCode => {
//                     if (exitCode) return;
//                     console.log("video", videoIndex++, "generated");
//                     sequentialCall();
//                 });
//             };
//         return sequentialCall();
//     });
// });
// getDirectoryArray("./", ".mkv").then(files => {
//     // return new promise((resolve, reject) => {
//     //     let videoIndex = 1,
//     //         promiseArray = [],
//     //         sequentialCall = () => {
//     //             if (!files.length) return resolve();
//     //             let file = files.shift(),
//     //                 fullPath = path.resolve("./", file),
//     //                 desPath = path.resolve("./", "resizedSegment"+(videoIndex++)+".mkv");
//     //             console.log("cropping", file);
//     //             exe("ffmpeg -i "+fullPath+" -vf scale=1280:-1,crop=1280:720 "+desPath, exitCode => {
//     //                 if (exitCode) return;
//     //                 console.log("video", file, "cropped and ready to remove");
//     //                 fs.unlink(fullPath, error => {
//     //                     if (error) throw error;
//     //                     console.log(file, "removed!");
//     //                     return sequentialCall();
//     //                 });
//     //             });        
//     //         };
//     //     return sequentialCall();
//     // });
//     let videoIndex = 1,
//         promiseArray = [];
//     for (let file of files) {
//         promiseArray.push(new promise((resolve, reject) => {
//             let fullPath = path.resolve("./", file),
//                 desPath = path.resolve("./", "resizedSegment"+(videoIndex++)+".mkv");
//             console.log("cropping", file);
//             exe("ffmpeg -i "+fullPath+" -vf scale=1280:-1,crop=1280:720 "+desPath, exitCode => {
//                 if (exitCode) return;
//                 console.log("video", file, "cropped and ready to remove");
//                 fs.unlink(fullPath, error => {
//                     if (error) throw error;
//                     console.log(file, "removed!");
//                     return resolve(desPath);
//                 });
//             });
//         }));
//     }
//     return promise.all(promiseArray);
// }).then(resultArray => {
//     console.log(resultArray);
    // exe("ffmpeg -f concat -safe 0 -i <(for f in *.mkv; do echo \"file '$PWD/$f'\"; done) -c copy rendered.mkv", exitCode => {
    // exe(["ffmpeg", "-i", "<(for f in *.mkv; do echo \"file '$PWD/$f'\"; done)", "-c", "copy", "rendered.mkv"], exitCode => {
    //     console.log("Rederring Completed!");
    // });
// });

function getDirectoryArray(dir, fileExtension, count) {
    return readdirPromise(dir).then(dirs => {
        let directoryArray = [];
        for (let dir of dirs) {
            if (count && directoryArray.length >= count) break;
            if (!fileExtension) {
                try {
                    let stat = fs.statSync(dir);
                    if (!stat.isDirectory()) continue;
                    if (dir === 'node_modules') continue;
                    directoryArray.push(dir);
                } catch (e) {
                    continue;
                }
                continue;
            }
            if (path.extname(dir) !== fileExtension) continue;
            directoryArray.push(dir);
        }
        return directoryArray;
    });
}

function inspectFolderFiles() {
    return getDirectoryArray("./").then(dirs => {
        let promiseArray = [];
        for (let dir of dirs) {
            let relativePath = path.resolve("./", dir);
            promiseArray.push(getDirectoryArray(relativePath, ".JPG", 1).then(file => {
                let fileIndex = file[0].match(/(\d+).JPG/)[1];
                return [relativePath, parseInt(fileIndex)];
            }));
        }
        return promise.all(promiseArray);
    });
}

function generateRawVideo(resultArray) {
    return new promise((resolve, reject) => {
        let videoIndex = 1,
            sequentialCall = () => {
                if (!resultArray.length) return resolve();
                let processItem = resultArray.shift();
                console.log("start processing...", processItem);
                exe(["ffmpeg", "-r", FPS, "-f", "image2", "-start_number", processItem[1], "-i", path.resolve(processItem[0], "G00%d.JPG"), "-vcodec", "libx264", "-crf", 25, "segment"+(videoIndex<10?'0'+videoIndex:videoIndex)+".mkv"], exitCode => {
                    if (exitCode) return;
                    console.log("video", videoIndex++, "generated");
                    sequentialCall();
                });
            };
        return sequentialCall();
    });
}

function resizeAndCrop() {
    return getDirectoryArray("./", ".mkv").then(files => {
        // return new promise((resolve, reject) => {
        //     let videoIndex = 1,
        //         promiseArray = [],
        //         sequentialCall = () => {
        //             if (!files.length) return resolve();
        //             let file = files.shift(),
        //                 fullPath = path.resolve("./", file),
        //                 desPath = path.resolve("./", "resizedSegment"+(videoIndex++)+".mkv");
        //             console.log("cropping", file);
        //             exe("ffmpeg -i "+fullPath+" -vf scale=1280:-1,crop=1280:720 "+desPath, exitCode => {
        //                 if (exitCode) return;
        //                 console.log("video", file, "cropped and ready to remove");
        //                 fs.unlink(fullPath, error => {
        //                     if (error) throw error;
        //                     console.log(file, "removed!");
        //                     return sequentialCall();
        //                 });
        //             });        
        //         };
        //     return sequentialCall();
        // });
        let videoIndex = 1,
            promiseArray = [];
        for (let file of files) {
            promiseArray.push(new promise((resolve, reject) => {
                let fullPath = path.resolve("./", file),
                    desPath = path.resolve("./", "resized"+(videoIndex<10?'0'+videoIndex:videoIndex)+".mkv");
                videoIndex++;
                console.log("cropping", file);
                exe(["ffmpeg", "-i", fullPath, "-vf", "scale=1280:-1,crop=1280:720", desPath], exitCode => {
                    if (exitCode) return;
                    console.log("video", file, "cropped and ready to remove");
                    return resolve();
                });
            }));
        }
        return promise.all(promiseArray);
    });
}

function combine() {
    return new promise((resolve, reject) => {
        getDirectoryArray("./", ".mkv").then(files => {
            files = files.filter(file => file.indexOf('resized') > -1);
            let tempFileList = path.resolve("./", 'files.txt'),
                filelistData = files.reduce((prev, next) => {return prev + "file '" + path.resolve(next) + "'\n";}, "");
            console.log(filelistData);
            fs.writeFile(tempFileList, filelistData, error => {
                if (error) throw error;
                console.log('temp file created');
                exe(["ffmpeg", "-f", "concat", "-safe", 0, "-i", "files.txt", "-c", "copy", "rendered.mkv"], exitCode => {
                    console.log("Rederring Completed!");
                    fs.unlink(tempFileList, error => {
                        if (error) throw error;
                        console.log(tempFileList, "removed!");
                        for (file of files) {
                            console.log("removing", file, "...");
                            fs.unlink(path.resolve(file), error => {
                                if (error) throw error;
                            });
                        }
                        return resolve();
                    });
                });
            });
        });
    });
}

inspectFolderFiles().then(generateRawVideo).then(resizeAndCrop).then(combine).then(() => {
    console.log("Process Completed!");
});