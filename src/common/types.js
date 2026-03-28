// ─── Enums ────────────────────────────────────────────────────────────────────
export var ConditionType;
(function (ConditionType) {
    ConditionType["POISON"] = "POISON";
    ConditionType["WOUND"] = "WOUND";
    ConditionType["IMMOBILIZE"] = "IMMOBILIZE";
    ConditionType["DISARM"] = "DISARM";
    ConditionType["STUN"] = "STUN";
    ConditionType["MUDDLE"] = "MUDDLE";
    ConditionType["CURSE"] = "CURSE";
    ConditionType["BLESS"] = "BLESS";
    ConditionType["STRENGTHEN"] = "STRENGTHEN";
    ConditionType["INVISIBLE"] = "INVISIBLE";
})(ConditionType || (ConditionType = {}));
export var Element;
(function (Element) {
    Element["FIRE"] = "FIRE";
    Element["ICE"] = "ICE";
    Element["AIR"] = "AIR";
    Element["EARTH"] = "EARTH";
    Element["LIGHT"] = "LIGHT";
    Element["DARK"] = "DARK";
})(Element || (Element = {}));
export var ElementStrength;
(function (ElementStrength) {
    ElementStrength["INERT"] = "INERT";
    ElementStrength["WANING"] = "WANING";
    ElementStrength["STRONG"] = "STRONG";
})(ElementStrength || (ElementStrength = {}));
export var TerrainType;
(function (TerrainType) {
    TerrainType["NORMAL"] = "NORMAL";
    TerrainType["WALL"] = "WALL";
    TerrainType["OBSTACLE"] = "OBSTACLE";
    TerrainType["DIFFICULT"] = "DIFFICULT";
    TerrainType["TRAP"] = "TRAP";
    TerrainType["DOOR"] = "DOOR";
    TerrainType["CORRIDOR"] = "CORRIDOR";
})(TerrainType || (TerrainType = {}));
export var ActorType;
(function (ActorType) {
    ActorType["PLAYER"] = "PLAYER";
    ActorType["MONSTER"] = "MONSTER";
})(ActorType || (ActorType = {}));
export var TargetType;
(function (TargetType) {
    TargetType["SINGLE"] = "SINGLE";
    TargetType["ALL_ADJACENT"] = "ALL_ADJACENT";
    TargetType["ALL_IN_RANGE"] = "ALL_IN_RANGE";
})(TargetType || (TargetType = {}));
export var AoeShape;
(function (AoeShape) {
    AoeShape["CONE"] = "CONE";
    AoeShape["LINE"] = "LINE";
    AoeShape["STAR"] = "STAR";
})(AoeShape || (AoeShape = {}));
export var CardClass;
(function (CardClass) {
    CardClass["INOX_DRIFTER"] = "INOX_DRIFTER";
    CardClass["VALRATH_RED_GUARD"] = "VALRATH_RED_GUARD";
    CardClass["QUATRYL_DEMOLITIONIST"] = "QUATRYL_DEMOLITIONIST";
    CardClass["AESTHER_HATCHET"] = "AESTHER_HATCHET";
})(CardClass || (CardClass = {}));
export var ModifierCardType;
(function (ModifierCardType) {
    ModifierCardType["NORMAL"] = "NORMAL";
    ModifierCardType["BLESS"] = "BLESS";
    ModifierCardType["CURSE"] = "CURSE";
    ModifierCardType["ROLLING"] = "ROLLING";
})(ModifierCardType || (ModifierCardType = {}));
export var ScenarioResult;
(function (ScenarioResult) {
    ScenarioResult["VICTORY"] = "VICTORY";
    ScenarioResult["DEFEAT"] = "DEFEAT";
    ScenarioResult["IN_PROGRESS"] = "IN_PROGRESS";
})(ScenarioResult || (ScenarioResult = {}));
