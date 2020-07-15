const fsWrite = require('fs').writeFile;
const fsRead = require('fs').readFile;
const { Observable } = require('rxjs');
const exec = require('child_process').exec;
const process = require('process');

module.exports = () => {
  if (process.env.CURRENT_CLOUD_URL === undefined) {
    return;
  }
  const revision = new Observable(s => {
    exec('git rev-parse HEAD', (shaError, shaStdout, shaStderr) => {
      if (shaError !== null) {
        console.log('git error: ' + shaError + shaStderr);
      }

      s.next(shaStdout.toString().trim());
      s.complete();
    });
  });

  revision.subscribe(function(res) {
    console.log(res);

    const indexPath = './www/index.html';

    fsRead(indexPath, (err, fileContent) => {
      if (err) {
        console.error(err);
        throw err;
      }

      let strFileContent = fileContent.toString();

      const regexp = RegExp(/(src|rel=".+?[stylesheet|icon]+".+?href)\s*=\s*"(.+?)"/g);

      let result;

      while (result = regexp.exec(strFileContent)) {
        if (result[2].search(/http.+/) === 0) {
          continue;
        }

        const assetName = result[2].replace(/\.\//, '');
        const assetScriptBody = result[0].replace(result[2], process.env.CURRENT_CLOUD_URL + `${res}/` + assetName);
        strFileContent = strFileContent.replace(result[0], assetScriptBody);
      }

      strFileContent = strFileContent.replace(/<script.+?><\/body>/g, (match) => {
        return '\t' + match;
      });

      strFileContent = strFileContent.replace(/<\/.+?></g, (match) => {
        return match.slice(0, -1) + '\r\n\t' + match.slice(-1);
      });

      strFileContent = strFileContent.replace(/\n\t<script/g, (match) => {
        return match.replace(/\n\t/g, "\n\t\t");
      });

      strFileContent = strFileContent.replace(/\xa0{2}<script.+?><\/script>/g, (match) => {
        return '\t' + match;
      });

      strFileContent = strFileContent.replace(/^\s{4}<link rel="stylesheet".+?>/gm, (match) => {
        return '\t' + match + '\r\n\t';
      });

      strFileContent = strFileContent.replace(/nomodule/g, 'type="nomodule"');

      fsWrite("./www/index.html", strFileContent, (err) => {
        if (err) {
          throw console.error(err);
        }
      });
    });
  });
}
