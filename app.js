const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initialDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initialDBAndServer();

//Home API
app.get("/", (req, res) => {
  res.send("Hi Darling...!");
});

//Convert Players Details DB
const convertPlayersDetailsDB = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

// GET Players Details API 1
app.get("/players/", async (req, res) => {
  const getPlayersQuery = `
    SELECT
        *
    FROM
        player_details;
    `;

  const playersDetails = await db.all(getPlayersQuery);
  res.send(
    playersDetails.map((eachPlayerDetails) =>
      convertPlayersDetailsDB(eachPlayerDetails)
    )
  );
});

//GET Player Details API 2
app.get("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const getPlayerDetailsQuery = `
    SELECT
        *
    FROM
        player_details
    WHERE
        player_id = ${playerId};
    `;

  const playerDetails = await db.get(getPlayerDetailsQuery);
  res.send(convertPlayersDetailsDB(playerDetails));
});

//PUT Player Details API 3
app.put("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const { playerName } = req.body;

  const putPlayerDetailsQuery = `
    UPDATE
        player_details
    SET
        player_name = '${playerName}'
    WHERE
        player_id = ${playerId};
    `;

  await db.run(putPlayerDetailsQuery);
  res.send("Player Details Updated");
});

//Convert Match Details DB
const convertMatchDetailsDB = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//GET Match Details API 4
app.get("/matches/:matchId/", async (req, res) => {
  const { matchId } = req.params;
  const getMatchDetailsQuery = `
    SELECT 
        *
    FROM
        match_details
    WHERE
        match_id = ${matchId};
    `;

  const matchDetails = await db.get(getMatchDetailsQuery);
  res.send(convertMatchDetailsDB(matchDetails));
});

//GET Player Matches API 5
app.get("/players/:playerId/matches", async (req, res) => {
  const { playerId } = req.params;
  const getPlayerMatchesDetailsQuery = `
    SELECT
        *
    FROM 
        match_details NATURAL JOIN player_match_score
    WHERE
        player_id = ${playerId};
    `;

  const playerMatchesDetails = await db.all(getPlayerMatchesDetailsQuery);
  res.send(
    playerMatchesDetails.map((eachMatchDetails) =>
      convertMatchDetailsDB(eachMatchDetails)
    )
  );
});

//Convert Player Object to Response Object
// const convertPlayerObjToResponseObj = (DbObject) => {
//   return {
//     playerId: DbObject.player_id,
//     playerName: DbObject.player_name,
//     matchId: DbObject.match_id,
//     match: DbObject.match,
//     year: DbObject.year,
//     playerMatchId: DbObject.player_match_id,
//     playerId: DbObject.player_id,
//     matchId: DbObject.match_id,
//     score: DbObject.score,
//     fours: DbObject.fours,
//     sixes: DbObject.sixes,
//   };
// };

//GET Matches by Players API 6
app.get("/matches/:matchId/players", async (req, res) => {
  const { matchId } = req.params;
  const getMatchesByPlayersQuery = `
    SELECT
        player_details.player_id, player_name
    FROM
        player_details NATURAL JOIN player_match_score
    WHERE
        player_match_score.match_id = ${matchId};
    `;

  const matchesByPlayers = await db.all(getMatchesByPlayersQuery);
  res.send(
    matchesByPlayers.map((eachMatch) => convertPlayersDetailsDB(eachMatch))
  );
});

//GET Player Scores API 7
app.get("/players/:playerId/playerScores", async (req, res) => {
  const { playerId } = req.params;
  const getPlayerScoresQuery = `
    SELECT
        player_details.player_id AS playerId,
        player_name AS playerName,
        sum(score) AS totalScore,
        sum(fours) AS totalFours,
        sum(sixes) AS totalSixes
    FROM
        player_details NATURAL JOIN player_match_score
    WHERE
        player_details.player_id = ${playerId};
    `;

  const playerScores = await db.get(getPlayerScoresQuery);
  res.send(playerScores);
});

module.exports = app;
