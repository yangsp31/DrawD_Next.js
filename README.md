# DrawD - OLED 다이어그램 작성 웹 서비스 (Front-end application)

### 사이트 방문 : https://do.drawd.store
* 해당 사이트는 사용자의 그 어떠한 정보도 서비스 이외의 목적으로 사용하지 않으며, 사용자의 결과물을 이용하거나 타인에게 공개하지 않습니다.
<br>

* 2025.02.03. - 진행중.
* 1인 프로젝트로 진행.
<br><br><br>

# 개요

* 디스플레이 분야, 특히 OLED를 연구하는 대학원생의 연구 및 문서 작업 효율성을 높이기 위한 웹 서비스
* 사람이 손으로 그린 도식보다 정밀하고 객관적인 다이어그램을 작성할 수 있도록 지원하며, 실험 설계 단계나 연구 내용을 설명할 때 시각적 근거 자료로 활용될 수 있도록 개발
* Vercel에서 지원하는 무료 배포 서비스를 사용하여 배포 (도메인을 구매하여 적용)
<br><br>

# Architecture
![Architecture](https://github.com/user-attachments/assets/2593dac2-4c52-40aa-a57c-e878742eb315)
<br><br>

# Screen

<p align="center">
  <img src="https://github.com/user-attachments/assets/5d9749d7-5f80-4697-bf98-f02be1c43c82"/>
  <img src="https://github.com/user-attachments/assets/df8893c4-fc3a-40d1-8170-6a03a3843dc1"/>
  <img src="https://github.com/user-attachments/assets/33f2eaf7-ab22-41cc-b2eb-f027912093cc"/>
</p>
<br><br>

# 사용기술

* ### Next.js
  * Next.js는 API route와 SSR을 사용하지 않고도 CSR만으로 강력한 Front-end application을 구축할 수 있는 프레임워크라 판단하여 사용

* ### uuid
  * 사용자가 작성하는 다이어그램을 고유하게 식별하기 위해 사용.
<br><br>

# 주요 개발내역

* ### 다이어그램 작성 구현 ([코드위치](https://github.com/yangsp31/DrawD_Next.js/blob/main/src/app/(page)/newD/%5Buuid%5D/page.tsx))
  * useRef를 활용해 canvas DOM 요소를 참조하여, 사용자가 브라우저 상에서 직접 다이어그램을 작성하고 수정할 수 있도록 구현.
  * 다이어그램은 각각 canvas에서 X, Y 좌표에 따라 그려지므로, 작성 순서에 상관없이 위치 정보를 바탕으로 항상 사용자가 그린대로 정확하게 렌더링되도록 구현.
  * 다양한 기능에 맞게 다이어그램을 그리기 위해 다이어그램의 데이터를 구조화하고 [diagram, setDiagram] = useState<DiagramComponent[]>([]); 형태로 다이어그램들을 관리.
* DiagramComponent 구조
```
interface DiagramComponent {
id: number;
x: number;
y: number;
width: number;
height: number;
name: string;
highValue: number;
lowValue: number | null;
color: string;
zIndex: number;
type: 'Organic' | 'Metal' | 'Other';
cuts: { start: number; end: number }[];
showValues: boolean;
invert: boolean;
}
```
---

* ### 다이어그램 저장 및 사용자 예외처리 구현 ([코드위치](https://github.com/yangsp31/DrawD_Next.js/blob/main/src/app/(page)/newD/%5Buuid%5D/page.tsx#L705))
  * 서버 오류로 인해 정상적인 저장이 불가능하거나, 사용자가 저장하지 않고 작성 페이지를 이탈한 경우를 대비해, 다이어그램 데이터를 JSON 문자열 형태로 Local Storage에 임시 저장하여 데이터 손실을 막도록 구현.
  * 사용자가 작성한 다이어그램 목록 페이지에서 임시 저장된 항목도 함께 출력되도록 하여 언제든지 수정 및 저장이 가능하도록 구현.
* Local Storage에 임시저장될 데이터의 구조
```
const data = {
      uuid : nowUuid,
      diagram : JSON.stringify(nowDiagram.current),
      createDate : date
    };

    localStorage.setItem(nowUuid, JSON.stringify(data));
```
---

* ### 재료검색 구현 ([코드위치](https://github.com/yangsp31/DrawD_Next.js/blob/main/src/app/(page)/newD/%5Buuid%5D/page.tsx#L679))
  * 재료 검색 기능 사용 시, 사용자의 모든 텍스트 입력마다 서버 요청 함수가 실행되어, 최악의 경우 영어 기준 15자 입력에 15번의 요청, 한국어는 그 이상의 요청이 발생해 서버에 과도한 부담이 발생.
  * 재료 검색 기능은 사용자가 타이핑을 완료한 이후에 검색 요청이 발생하는 것이 가장 적절하다 생각하여, Debouncing을 적용하여, 사용자의 입력마다 서버 요청이 발생하던 기존 방식보다 서버 부하를 줄이고, 효율적인 요청 처리를 구현.
<br><br>

# 회고 & 개선 필요사항 (회고 원문 : [Velog](https://velog.io/@yang_seongp31/DrawD-Next.js))

* ### 다이어그램 탐색
  * 특정 다이어그램을 선택하여 수정하거나 삭제를 진행하면 배열을 처음부터 탐색하며 선택한 다이어그램을 찾아 작업을 진행 해야함.
  * 다이어그램을 모두 출력할 때도 배열의 요소들을 처음부터 하나하나 그리며 출력되기에 배열의 처음부터 접근하는 것이 최소 2번은 진행하게 됨.
  * 탐색시에는 이진탐색 또는 이진 탐색 트리와 같은 알고리즘을 사용 한다면 시간복잡도는 줄어들고 성능은 상승하게 될수도 있음.
  * 다이어그램이라는 데이터는 선형적인 특성을 가지고 있다고 판단하여 별다른 탐색 알고리즘과 Tree형태로 데이터 구조를 구축하지 않았음.
  * 그럼에도 이진탐색 정도는 충분히 적용 가능하였다고 생각힘.
  * 다이어그램의 위치와 순서가 바뀌어도 배열 안에는 추가된 순서가 유지되며 순서에 맞게 정수형 ID가 부여되어 있는 상태이기에 이진탐색을 적용하지 않음은 실책.
<br><br>

* ### 개선사항
  * 다이어그램 탐색시 기본적인 배열 순회 방식에서 이진탐색으로 전환 필요

