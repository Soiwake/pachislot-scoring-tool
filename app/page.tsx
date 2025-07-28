"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, ArrowLeft, TrendingUp, TrendingDown, Minus, Target, Lightbulb, BarChart3 } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

interface MachineData {
  model: string
  setting1: string
  setting2: string
  setting3: string
  setting4: string
  setting5: string
  setting6: string
  sales: string
}

interface FormData {
  date: Date | undefined
  machines: MachineData[]
  dayOfWeek: string
  hasEvent: boolean
  islandLocation: string
}

interface MachineResult {
  model: string
  sales: number
  averageSetting: number
  efficiency: number
  median: number
  recommendation: string
  settingDistribution: number[]
}

interface ScoreResult {
  totalScore: number
  totalSales: number
  totalMedian: number
  difference: number
  comment: string
  status: "good" | "average" | "caution"
  machines: MachineResult[]
  improvements: string[]
}

export default function PachislotScoringTool() {
  const [currentScreen, setCurrentScreen] = useState<"input" | "result">("input")
  const [formData, setFormData] = useState<FormData>({
    date: new Date(),
    machines: [
      { model: "", setting1: "", setting2: "", setting3: "", setting4: "", setting5: "", setting6: "", sales: "" },
      { model: "", setting1: "", setting2: "", setting3: "", setting4: "", setting5: "", setting6: "", sales: "" },
      { model: "", setting1: "", setting2: "", setting3: "", setting4: "", setting5: "", setting6: "", sales: "" },
    ],
    dayOfWeek: "",
    hasEvent: false,
    islandLocation: "",
  })
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)

  const machineModels = [
    "パチスロ 北斗の拳",
    "パチスロ ゴッドイーター",
    "パチスロ まどか☆マギカ",
    "パチスロ 戦国乙女",
    "パチスロ 番長3",
    "パチスロ ハナハナ",
  ]

  const islandLocations = ["中央島", "壁際島", "入口付近島", "奥側島"]

  const updateMachineData = (index: number, field: keyof MachineData, value: string) => {
    const newMachines = [...formData.machines]
    newMachines[index] = { ...newMachines[index], [field]: value }
    setFormData({ ...formData, machines: newMachines })
  }

  const calculateScore = () => {
    const machineResults: MachineResult[] = []
    let totalSales = 0
    let totalMedian = 0

    formData.machines.forEach((machine) => {
      if (!machine.model || !machine.sales) return

      const sales = Number.parseInt(machine.sales) || 0
      const settings = [
        Number.parseInt(machine.setting1) || 0,
        Number.parseInt(machine.setting2) || 0,
        Number.parseInt(machine.setting3) || 0,
        Number.parseInt(machine.setting4) || 0,
        Number.parseInt(machine.setting5) || 0,
        Number.parseInt(machine.setting6) || 0,
      ]

      const totalMachines = settings.reduce((sum, count) => sum + count, 0)
      const averageSetting =
        totalMachines > 0 ? settings.reduce((sum, count, index) => sum + count * (index + 1), 0) / totalMachines : 0

      // Mock calculation for median based on machine type and conditions
      const baseMedian = machine.model.includes("北斗") ? 45000 : machine.model.includes("まどか") ? 38000 : 35000
      const eventBonus = formData.hasEvent ? 1.1 : 1.0
      const islandBonus = formData.islandLocation === "中央島" ? 1.05 : 1.0
      const median = Math.round(baseMedian * eventBonus * islandBonus * totalMachines)

      const efficiency = median > 0 ? (sales / median) * 100 : 0

      let recommendation = ""
      if (averageSetting < 3.5) {
        recommendation = "設定4,5の配分を増やすことを推奨"
      } else if (averageSetting > 4.5) {
        recommendation = "高設定配分が適切、現状維持"
      } else {
        recommendation = "バランスの良い設定配分"
      }

      machineResults.push({
        model: machine.model,
        sales,
        averageSetting,
        efficiency,
        median,
        recommendation,
        settingDistribution: settings,
      })

      totalSales += sales
      totalMedian += median
    })

    const difference = totalSales - totalMedian
    const totalScore = totalMedian > 0 ? (difference / totalMedian) * 100 : 0

    let status: "good" | "average" | "caution" = "average"
    let comment = ""
    const improvements: string[] = []

    if (totalScore > 10) {
      status = "good"
      comment = "全体的に優秀な売上です。現在の設定配分戦略が効果的に機能しています。"
    } else if (totalScore > 0) {
      status = "average"
      comment = "平均的な売上です。一部機種で改善の余地があります。"
    } else {
      status = "caution"
      comment = "売上が期待値を下回っています。設定配分の見直しが必要です。"
    }

    // Generate improvement suggestions
    machineResults.forEach((machine) => {
      if (machine.efficiency < 90) {
        improvements.push(`${machine.model}: ${machine.recommendation}`)
      }
    })

    if (improvements.length === 0) {
      improvements.push("現在の設定配分は良好です。継続して様子を見ましょう。")
    }

    setScoreResult({
      totalScore,
      totalSales,
      totalMedian,
      difference,
      comment,
      status,
      machines: machineResults,
      improvements,
    })

    setCurrentScreen("result")
  }

  const resetForm = () => {
    setCurrentScreen("input")
    setScoreResult(null)
  }

  if (currentScreen === "result" && scoreResult) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Overall Score */}
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-gray-800">営業成績スコア</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  {scoreResult.status === "good" && <TrendingUp className="h-8 w-8 text-green-500 mr-2" />}
                  {scoreResult.status === "average" && <Minus className="h-8 w-8 text-yellow-500 mr-2" />}
                  {scoreResult.status === "caution" && <TrendingDown className="h-8 w-8 text-red-500 mr-2" />}
                  <span
                    className={`text-6xl font-bold ${
                      scoreResult.status === "good"
                        ? "text-green-600"
                        : scoreResult.status === "average"
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {scoreResult.totalScore > 0 ? "+" : ""}
                    {scoreResult.totalScore.toFixed(1)}%
                  </span>
                </div>
                <div
                  className={`inline-block px-4 py-2 rounded-full text-white font-semibold ${
                    scoreResult.status === "good"
                      ? "bg-green-500"
                      : scoreResult.status === "average"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                >
                  {scoreResult.status === "good" ? "良好" : scoreResult.status === "average" ? "平均" : "注意"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600 mb-1">合計中央値</div>
                    <div className="text-2xl font-bold text-blue-600">¥{scoreResult.totalMedian.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600 mb-1">合計売上</div>
                    <div className="text-2xl font-bold text-green-600">¥{scoreResult.totalSales.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600 mb-1">差分</div>
                    <div
                      className={`text-2xl font-bold ${scoreResult.difference >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {scoreResult.difference >= 0 ? "+" : ""}¥{scoreResult.difference.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Machine Details */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                機種別詳細分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scoreResult.machines.map((machine, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <div className="font-semibold text-lg mb-2">{machine.model}</div>
                          <div className="text-sm text-gray-600">売上: ¥{machine.sales.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">中央値: ¥{machine.median.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">平均設定</div>
                          <div className="text-2xl font-bold text-blue-600">{machine.averageSetting.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">効率</div>
                          <div
                            className={`text-2xl font-bold ${
                              machine.efficiency >= 100
                                ? "text-green-600"
                                : machine.efficiency >= 90
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {machine.efficiency.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">設定配分</div>
                          <div className="flex flex-wrap gap-1">
                            {machine.settingDistribution.map(
                              (count, settingIndex) =>
                                count > 0 && (
                                  <Badge key={settingIndex} variant="outline" className="text-xs">
                                    設定{settingIndex + 1}: {count}台
                                  </Badge>
                                ),
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-gray-50 rounded">
                        <div className="text-sm font-medium text-gray-700">
                          <Target className="h-4 w-4 inline mr-1" />
                          {machine.recommendation}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Improvement Suggestions */}
          <Card className="shadow-lg bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800">
                <Lightbulb className="h-5 w-5 mr-2" />
                改善提案
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scoreResult.improvements.map((improvement, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-yellow-700">{improvement}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Overall Comment */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">総合診断</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{scoreResult.comment}</p>
            </CardContent>
          </Card>

          <Button onClick={resetForm} className="w-full bg-transparent" variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            入力画面に戻る
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-800">スロット台営業成績データ入力</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date">日付</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "yyyy年MM月dd日", { locale: ja }) : "日付を選択"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => setFormData({ ...formData, date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Day of Week */}
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">曜日</Label>
              <Select
                value={formData.dayOfWeek}
                onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="曜日を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">月曜日</SelectItem>
                  <SelectItem value="tuesday">火曜日</SelectItem>
                  <SelectItem value="wednesday">水曜日</SelectItem>
                  <SelectItem value="thursday">木曜日</SelectItem>
                  <SelectItem value="friday">金曜日</SelectItem>
                  <SelectItem value="saturday">土曜日</SelectItem>
                  <SelectItem value="sunday">日曜日</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Event Presence */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasEvent"
                checked={formData.hasEvent}
                onCheckedChange={(checked) => setFormData({ ...formData, hasEvent: checked as boolean })}
              />
              <Label htmlFor="hasEvent">イベント有無</Label>
            </div>

            {/* Island Location */}
            <div className="space-y-2">
              <Label htmlFor="islandLocation">島配置</Label>
              <Select
                value={formData.islandLocation}
                onValueChange={(value) => setFormData({ ...formData, islandLocation: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="島配置を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {islandLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Machine Data */}
            <div className="space-y-6">
              <Label className="text-lg font-semibold">機種別データ入力</Label>
              {formData.machines.map((machine, index) => (
                <Card key={index} className="border-2 border-dashed border-gray-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">機種 {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Machine Model */}
                    <div className="space-y-2">
                      <Label>機種名</Label>
                      <Select value={machine.model} onValueChange={(value) => updateMachineData(index, "model", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="機種を選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          {machineModels.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Setting Distribution */}
                    <div className="space-y-2">
                      <Label className="font-semibold">設定配分</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((setting) => (
                          <div key={setting} className="space-y-1">
                            <Label htmlFor={`machine${index}-setting${setting}`} className="text-sm">
                              設定{setting}
                            </Label>
                            <Input
                              id={`machine${index}-setting${setting}`}
                              type="number"
                              placeholder="台数"
                              value={machine[`setting${setting}` as keyof MachineData]}
                              onChange={(e) =>
                                updateMachineData(index, `setting${setting}` as keyof MachineData, e.target.value)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sales */}
                    <div className="space-y-2">
                      <Label>売上</Label>
                      <Input
                        type="number"
                        placeholder="売上金額を入力してください"
                        value={machine.sales}
                        onChange={(e) => updateMachineData(index, "sales", e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Calculate Button */}
            <Button
              onClick={calculateScore}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-lg"
              disabled={!formData.machines.some((m) => m.model && m.sales)}
            >
              スコアを算出
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
