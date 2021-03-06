const gifTerm = require('gif-term');
const readline = require('readline');
const chalk = require('chalk');
const clipboardy = require('clipboardy');
const ora = require('ora');


function getErrorOutput(err) {
    return err ? chalk.bold(chalk.red('>>> ') + chalk.gray(err)) : ''
}


async function fetchGif(text, flags) {
    const {
        imgStr: output = null,
        errorMsg,
        url = null,
    } = await gifTerm.data(text, flags) || {}
    const error = getErrorOutput(errorMsg)
    return { output, url, error }
}

function checkClip (url, condition) {
    let copyAnswer = chalk.green('✔ ') + 'link copied to clipboard'
    if (condition) {
        clipboardy.writeSync(url);
        console.log(copyAnswer)
    }
}

async function search(text, flags) {
    let data = {}
    let spinner = null
    let intro = chalk.white('Type something and press the ' + chalk.bold('<enter>') + ' key to find a GIF');
    let question = chalk.white.bold(chalk.greenBright('? ') + 'Save GIF link? ' + chalk.reset('(y/n) '))
    let prompt = chalk.cyan('❯')

    if (text) {
        spinner = ora(text).start()
        data = await fetchGif(text, flags)
        spinner.stopAndPersist({ symbol: prompt, text: chalk.cyan(text) })
        console.log(data.output || data.error);
        checkClip( data.url, flags.clip && !data.error)
        process.exit(0)
        return
    }

    console.log(intro)

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: prompt + ' '
    });

    rl.prompt();

    rl.on('line', async (line) => {
        let text = line.trim()

        switch (text) {
            case '':
                const error = getErrorOutput('Need to write something...')
                console.log(error)
                break;
            default:
                readline.clearLine(rl.input, 0)
                readline.moveCursor(rl.input, 0, -1)
                spinner = ora(text).start()
                data = await fetchGif(text, flags)
                spinner.stopAndPersist({ symbol: prompt, text: chalk.cyan(text) })
                console.log(data.output || data.error);

                break;
        }

        rl.prompt();

    }).on('SIGINT', () => {
        if (!data.url) {
            rl.close()
            return
        }

        rl.question(question, (answer) => {
            checkClip(data.url, answer.match(/^y(es)?$/i))
            rl.pause();
        });
        
    }).on('close', () => {
        readline.clearLine(rl.output, -1)
        readline.moveCursor(rl.output, -3, 0)
        console.log(chalk.yellow('Bye!'))
        process.exit(0)
    });



}

module.exports = { search };