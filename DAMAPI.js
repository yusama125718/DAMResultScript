function getDAMAPI(api_url, sheet_name, xml_key, type) {
  // 各種情報定義
  const cdmCardNo = "cdmNoを入力"
  const url = api_url

  // シートを取得
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(sheet_name)
  let insertRow = 2
  let page = 1

  while(true){
    // データを取得
    const responce = UrlFetchApp.fetch(url + "?cdmCardNo=" + cdmCardNo + "&pageNo=" + page)

    // XMLに変換
    const xmlDocs = XmlService.parse(responce.getContentText())
    // 無名のネームスペースを取得し、採点結果のリストを取得
    const ns = XmlService.getNamespace("", xml_key)
    const datas = xmlDocs.getRootElement().getChild("list", ns).getChildren("data", ns)

    let base = "scoring";
    let song = "contentsName"
    if (sheet_name == "Wao"){
      base += "Hearts";
      song = "songName";
    }

    // データをシートに格納
    for(let i = 0; i < datas.length; i++){
      const data = datas[i].getChild(base, ns)

      // IDが同じデータの場合処理を終了する
      const id = data.getAttribute('scoring' + type + 'Id').getValue()
      if (id == sheet.getRange(insertRow, 1).getValue()) return;
      sheet.insertRowBefore(insertRow)

      // ID,楽曲情報を挿入
      sheet.getRange(insertRow, 1).setValue(id)
      sheet.getRange(insertRow, 2).setValue(data.getAttribute(song).getValue())
      sheet.getRange(insertRow, 3).setValue(data.getAttribute('artistName').getValue())

      // 得点を挿入
      let pointTxt = data.getText()
      let pointFew = pointTxt.slice(pointTxt.length - 3)
      pointTxt = pointTxt.slice(0, pointTxt.length - 3) + "." + pointFew
      sheet.getRange(insertRow, 4).setValue(pointTxt)

      // 日時を挿入
      const timestamp = data.getAttribute('scoringDateTime').getValue()
      let year = parseInt(timestamp.substring(0, 4), 10);
      let month = parseInt(timestamp.substring(4, 6), 10) - 1; // JavaScript の月は 0 から始まる
      let day = parseInt(timestamp.substring(6, 8), 10);
      let hour = parseInt(timestamp.substring(8, 10), 10);
      let minute = parseInt(timestamp.substring(10, 12), 10);
      let second = parseInt(timestamp.substring(12, 14), 10);

      let date = new Date(year, month, day, hour, minute, second);

      // フォーマットを作成
      let formattedDate = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm");
      sheet.getRange(insertRow, 5).setValue(formattedDate)

      // 集計用
      const cell = sheet.getRange(insertRow, 6);
      cell.setFormula("=ROUNDDOWN(INDIRECT(ADDRESS(ROW(), COLUMN()-2)), 0)");

      insertRow++
    }

    // 次ページがなかったら終了
    let hasNext = xmlDocs.getRootElement().getChild("data", ns).getChild("page", ns).getAttribute('hasNext').getValue()
    if (hasNext == "0") return
    page++
  }
}

function GetAiAPI(){
  getDAMAPI("https://www.clubdam.com/app/damtomo/scoring/GetScoringAiListXML.do", "Ai", "https://www.clubdam.com/app/damtomo/scoring/GetScoringAiListXML", "Ai");
}

function GetWaoAPI(){
  getDAMAPI("https://www.clubdam.com/app/damtomo/scoring/GetScoringHeartsListXML.do", "Wao", "https://www.clubdam.com/app/damtomo/scoring/GetScoringHeartsListXML", "HeartsHistory");
}
